import { beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
const from = vi.fn(() => ({ upload }));
vi.mock("../../lib/supabase", () => ({ supabase: () => ({ storage: { from } }), getSupabase: () => null }));

import { audioExt, audioPath, audioType, speakerOf, tellerOf, uploadVoice, voiceMemory, voiceTitle } from "./keep";
import { newStory } from "../../data/memories";
import type { Clip } from "../../data/stories";
import type { Take } from "./machine";

const take = (type = "audio/mp4"): Take => ({ blob: new Blob([new Uint8Array(8)], { type }), url: "blob:x", durationMs: 72_400 });
const clip: Clip = { id: "voice-m1", bucket: "memory-audio", path: "s1/m1/voice.m4a", speaker: "Sam", duration: 72, transcript: "" };
const question = { id: "q-sea", question: "What do you remember of the sea?", era: "Childhood" };

describe("the recorded file", () => {
  it("names the file by what the browser made", () => {
    expect(audioExt("audio/mp4")).toBe("m4a");
    expect(audioExt("audio/mp4;codecs=mp4a.40.2")).toBe("m4a");
    expect(audioExt("audio/webm;codecs=opus")).toBe("webm");
    expect(audioExt("audio/ogg;codecs=opus")).toBe("ogg");
    expect(audioExt("")).toBe("webm");
    expect(audioType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(audioType("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
    expect(audioType("")).toBe("audio/webm");
  });

  it("lives where the phone puts it: <story>/<memory>/<file>", () => {
    expect(audioPath("s1", "m1", "audio/mp4")).toBe("s1/m1/voice.m4a");
    expect(audioPath("s1", "m1", "audio/webm;codecs=opus")).toBe("s1/m1/voice.webm");
  });
});

describe("uploadVoice", () => {
  beforeEach(() => {
    upload.mockReset();
    from.mockClear();
  });

  it("uploads into memory-audio and returns the clip", async () => {
    upload.mockResolvedValue({ data: {}, error: null });
    const c = await uploadVoice("s1", "m1", take(), { speaker: "Sam" });
    expect(from).toHaveBeenCalledWith("memory-audio");
    expect(upload).toHaveBeenCalledWith("s1/m1/voice.m4a", expect.any(Blob), { contentType: "audio/mp4", upsert: false });
    expect(c).toMatchObject({ bucket: "memory-audio", path: "s1/m1/voice.m4a", speaker: "Sam", duration: 72 });
  });

  it("counts an object already there as uploaded (a retry)", async () => {
    upload.mockResolvedValue({ data: null, error: { statusCode: "409", message: "The resource already exists" } });
    await expect(uploadVoice("s1", "m1", take("audio/webm"))).resolves.toMatchObject({ path: "s1/m1/voice.webm" });
  });

  it("throws on any other failure, so the page can keep the take and say so", async () => {
    upload.mockResolvedValue({ data: null, error: { statusCode: "403", message: "new row violates row-level security policy" } });
    await expect(uploadVoice("s1", "m1", take())).rejects.toBeTruthy();
  });
});

describe("voiceTitle", () => {
  it("is the question, or whose voice it is", () => {
    expect(voiceTitle({ question: "  What   did you eat? " })).toBe("What did you eat?");
    expect(voiceTitle({ question: "x".repeat(100) })).toHaveLength(88);
    expect(voiceTitle({ name: "Rose", writer: "Sam" })).toBe("What Sam remembers of Rose");
    expect(voiceTitle({ name: "Rose" })).toBe("In Rose’s own voice");
    expect(voiceTitle()).toBe("In my own voice");
  });
});

describe("voiceMemory", () => {
  const own = newStory({ id: "s1", name: "Sam", relationship: "Myself", ownerId: "u1" });
  const grandma = newStory({ id: "s2", name: "Rose Hart", relationship: "Grandmother", ownerId: "u1" });
  const user = { id: "u1", firstName: "Sam" };

  it("records the question it answers, so it isn't dealt again", () => {
    const teller = tellerOf(own, user);
    const m = voiceMemory({ memoryId: "m1", story: own, question, words: " The sea was cold. ", clip, teller });
    expect(m).toMatchObject({ id: "m1", title: question.question, body: "The sea was cold.", era: "Childhood", status: "saved", privacy: "shared" });
    expect(m.prompt).toBe(question.question);
    expect(m.questionText).toBe(question.question);
    expect(m.questionId).toBe("q-sea");
    expect(m.via).toBe("recorded");
    expect(m.audio).toEqual([{ ...clip, transcript: "The sea was cold." }]);
    // your own story: no credit line
    expect(m.contributor).toBe("");
  });

  it("credits the writer on somebody else's story", () => {
    const people = [{ id: "p-sam", userId: "u1", givenName: "Sam" }];
    const teller = tellerOf(grandma, user, people);
    expect(teller.isStoryteller).toBe(false);
    const m = voiceMemory({ memoryId: "m2", story: grandma, question: null, words: "", clip, teller });
    expect(m.contributor).toBe("Sam");
    expect(m.authorPersonId).toBe("p-sam");
    expect(m.title).toBe("What Sam remembers of Rose");
    expect(m.body).toBe("");
    expect(m.prompt).toBeUndefined();
    expect(m.questionId).toBeUndefined();
  });

  it("names the speaker on the clip as the phone does", () => {
    expect(speakerOf(tellerOf(own, user), user)).toBe("Sam");
    expect(speakerOf(tellerOf(grandma, null), null)).toBe("Rose");
  });
});
