/**
 * The elder's answer link, end to end against a mocked `answer-link` Edge Function:
 * hear the asker → record (Chromium's fake microphone) → listen back → "Say it again" asks → send → "Sent to Sam",
 * in Vietnamese and English, at 360×740 and 800×1280; plus the written fallback, expired, answered, and a dropped
 * connection with "Try again".
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const HOST = "https://answer-test.supabase.co";
const FN = `${HOST}/functions/v1/answer-link`;
const UPLOAD = `${HOST}/storage/v1/object/upload/sign/question-answers/tok/answer.m4a?token=signed`;
const VOICE = `${HOST}/voice/sam.wav`;
const TOKEN = "tok_ABCdef123";

const base = {
  ok: true,
  askerName: "Sam",
  askerPhotoUrl: null as string | null,
  question: "What did your mother sing to you when you were small?",
  voiceUrl: VOICE as string | null,
  tellerName: "Rose",
  language: "en",
  answered: false,
  expired: false,
};
const vi = { ...base, tellerName: "Lan", language: "vi", question: "Hồi nhỏ, mẹ thường hát ru bạn bài gì?" };

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS" };

/** Three seconds of near-silence as a WAV, so "Hear Sam ask" really plays. */
function wav(seconds = 3, rate = 8000): Buffer {
  const n = seconds * rate;
  const b = Buffer.alloc(44 + n);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + n, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate, 28);
  b.writeUInt16LE(1, 32);
  b.writeUInt16LE(8, 34);
  b.write("data", 36);
  b.writeUInt32LE(n, 40);
  b.fill(128, 44);
  return b;
}

type Seen = { gets: number; posts: Record<string, unknown>[]; putBytes: number; putType: string; offline: boolean };
type Opts = { payload?: Record<string, unknown>; offline?: boolean; failDone?: number };

async function mock(page: Page, opts: Opts = {}): Promise<Seen> {
  const seen: Seen = { gets: 0, posts: [], putBytes: 0, putType: "", offline: Boolean(opts.offline) };
  let failDone = opts.failDone ?? 0;
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route("https://fonts.gstatic.com/**", (r) => r.abort());
  await page.route(`${HOST}/**`, async (route: Route) => {
    const req = route.request();
    const url = req.url();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (url.startsWith(FN)) {
      if (req.method() === "GET") {
        seen.gets++;
        expect(new URL(url).searchParams.get("t")).toBe(TOKEN);
        expect(req.headers()["apikey"]).toBe("anon-test-key");
        if (seen.offline) return route.abort("internetdisconnected");
        return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(opts.payload ?? base) });
      }
      const body = req.postDataJSON() as Record<string, unknown>;
      seen.posts.push(body);
      if (body.step === "upload") return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ ok: true, uploadUrl: UPLOAD, path: "answers/tok/answer.m4a", token: "signed", contentType: String(body.mime) }) });
      if (failDone-- > 0) return route.fulfill({ status: 500, headers: CORS, contentType: "application/json", body: JSON.stringify({ ok: false, error: "server" }) });
      return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ ok: true, sentTo: "Sam" }) });
    }
    if (url.startsWith(`${HOST}/storage/`) && req.method() === "PUT") {
      seen.putBytes = req.postDataBuffer()?.length ?? 0;
      seen.putType = req.headers()["content-type"] || "";
      return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: "{}" });
    }
    if (url === VOICE) return route.fulfill({ status: 200, contentType: "audio/wav", body: wav() });
    if (url.endsWith("/photo/sam.svg"))
      return route.fulfill({ status: 200, contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#c96"/></svg>` });
    return route.fulfill({ status: 404, headers: CORS, body: "" });
  });
  return seen;
}

/** ANSWER_SHOTS=<dir> saves a picture of each step for a human to look at. */
async function shot(page: Page, name: string) {
  const dir = process.env.ANSWER_SHOTS;
  if (dir) await page.screenshot({ path: `${dir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

/** Every phone's floor: no sideways scroll, big targets, large type, no plan or price words. */
async function checkFloor(page: Page) {
  const m = await page.evaluate(() => {
    const btns = [...document.querySelectorAll<HTMLElement>(".ans button")].filter((b) => b.offsetParent);
    const px = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      smallestTarget: Math.min(...btns.map((b) => b.getBoundingClientRect().height)),
      body: px(document.querySelector(".ans")),
      question: px(document.querySelector(".ans-q")),
      text: document.body.innerText,
    };
  });
  expect(m.overflow).toBeLessThanOrEqual(0);
  expect(m.smallestTarget).toBeGreaterThanOrEqual(64);
  expect(m.body).toBeGreaterThanOrEqual(20);
  if (m.question) expect(m.question).toBeGreaterThanOrEqual(28);
  expect(m.text).not.toMatch(/\bplans?\b|price|\$|subscri|trial|upgrade|sign in|đăng nhập|giá/i);
}

for (const [lang, payload, w] of [
  [
    "en",
    { ...base, askerPhotoUrl: `${HOST}/photo/sam.svg` },
    { asked: "Sam asked you", hear: "Hear Sam ask", pause: "Pause", record: "Answer in your voice", go: "Start recording", stop: "I’m done", listen: "Listen back", again: "Say it again", keep: "Keep this one", send: "Send to Sam", sent: "Sent to Sam.", thanks: "Thank you, Rose." },
  ],
  [
    "vi",
    vi,
    { asked: "Câu hỏi của Sam", hear: "Nghe Sam hỏi", pause: "Tạm dừng", record: "Trả lời bằng giọng nói", go: "Bắt đầu ghi âm", stop: "Xong rồi", listen: "Nghe lại", again: "Nói lại", keep: "Giữ bản này", send: "Gửi cho Sam", sent: "Đã gửi cho Sam.", thanks: "Cảm ơn Lan." },
  ],
] as const) {
  test(`${lang}: hear Sam, answer in her voice, send`, async ({ page }) => {
    const seen = await mock(page, { payload });
    await page.goto(`/a/${TOKEN}`);
    await expect(page.getByText(w.asked, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(payload.question);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await checkFloor(page);
    await shot(page, `${lang}-1-ask`);

    // Sam's voice: one tap
    await page.getByRole("button", { name: w.hear }).click();
    await expect(page.getByRole("button", { name: w.pause })).toBeVisible();
    await page.getByRole("button", { name: w.pause }).click();

    // the record button, the plain line about the permission prompt, then recording with a level meter and no clock
    await page.getByRole("button", { name: w.record }).click();
    await page.getByRole("button", { name: w.go }).click();
    const stop = page.getByRole("button", { name: w.stop });
    await expect(stop).toBeVisible();
    await expect(page.getByRole("meter")).toBeVisible();
    expect(await page.locator(".ans").innerText()).not.toMatch(/\d:\d\d/);
    await checkFloor(page);
    await shot(page, `${lang}-2-recording`);
    await page.waitForTimeout(1600);
    await stop.click();

    // review: listen back, "Say it again" asks first and can be declined
    await expect(page.getByRole("button", { name: w.listen })).toBeVisible();
    await page.getByRole("button", { name: w.again }).click();
    await page.getByRole("button", { name: w.keep }).click();
    await expect(page.getByRole("button", { name: w.send })).toBeVisible();
    await checkFloor(page);
    await shot(page, `${lang}-3-review`);

    await page.getByRole("button", { name: w.send }).click();
    await expect(page.getByRole("heading", { name: w.sent })).toBeVisible();
    await expect(page.getByText(w.thanks)).toBeVisible();
    await checkFloor(page);
    await shot(page, `${lang}-4-sent`);

    // lane S: prefer audio/mp4 (the asker hears it on an iPhone), and PUT with exactly the contentType it returns
    expect(seen.posts[0]).toMatchObject({ t: TOKEN, step: "upload", mime: "audio/mp4" });
    expect(seen.posts[0].size as number).toBeGreaterThan(500);
    expect(seen.putBytes).toBeGreaterThan(500);
    expect(seen.putType).toBe("audio/mp4");
    expect(seen.posts[1]).toMatchObject({ t: TOKEN, step: "done", path: "answers/tok/answer.m4a" });
    expect(seen.posts[1].durationMs as number).toBeGreaterThan(1000);
  });
}

test("en: the microphone refused → write the answer instead", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  const seen = await mock(page);
  await page.goto(`/a/${TOKEN}`);
  await page.getByRole("button", { name: "Answer in your voice" }).click();
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByText("The microphone isn’t available. You can write your answer here.")).toBeVisible();
  const send = page.getByRole("button", { name: "Send to Sam" });
  await expect(send).toBeDisabled();
  await page.getByLabel("Your answer").fill("Ru con, con ngủ cho ngoan.");
  await checkFloor(page);
  await send.click();
  await expect(page.getByRole("heading", { name: "Sent to Sam." })).toBeVisible();
  await expect(page.getByText("Sam will read your answer.")).toBeVisible();
  expect(seen.posts).toEqual([{ t: TOKEN, step: "done", text: "Ru con, con ngủ cho ngoan." }]);
});

test("vi: a closed question says so plainly", async ({ page }) => {
  await mock(page, { payload: { ...vi, expired: true, voiceUrl: null } });
  await page.goto(`/a/${TOKEN}`);
  await expect(page.getByText("Câu hỏi này đã đóng. Sam có thể gửi câu hỏi mới.")).toBeVisible();
  await expect(page.getByRole("button")).toHaveCount(0);
  await checkFloor(page);
});

test("en: an answered question says Sam has it", async ({ page }) => {
  await mock(page, { payload: { ...base, answered: true } });
  await page.goto(`/a/${TOKEN}`);
  await expect(page.getByText("You answered this one. Sam has it.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Answer in your voice" })).toHaveCount(0);
});

test("en: our side is busy (429) → says try again in a moment", async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await page.route(`${FN}**`, (r) =>
    r.request().method() === "OPTIONS"
      ? r.fulfill({ status: 204, headers: CORS })
      : r.fulfill({ status: 429, headers: CORS, contentType: "application/json", body: JSON.stringify({ ok: false, error: "rate_limited" }) }),
  );
  await page.goto(`/a/${TOKEN}`);
  await expect(page.getByText("Something went wrong on our side. Try again in a moment.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("en: no connection → Try again → the question", async ({ page }) => {
  const seen = await mock(page, { offline: true });
  await page.goto(`/a/${TOKEN}`);
  await expect(page.getByText("This didn’t open just now. Check the internet and try again.")).toBeVisible();
  await checkFloor(page);
  const before = seen.gets;
  seen.offline = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Sam asked you", { exact: true })).toBeVisible();
  expect(seen.gets).toBeGreaterThan(before);
});

test("vi: a send that fails keeps the answer and tries again", async ({ page }) => {
  const seen = await mock(page, { payload: vi, failDone: 1 });
  await page.goto(`/a/${TOKEN}`);
  await page.getByRole("button", { name: "Viết câu trả lời" }).click();
  await page.getByLabel("Câu trả lời").fill("Bà hát bài Ầu ơ.");
  await page.getByRole("button", { name: "Gửi cho Sam" }).click();
  await expect(page.getByText("Chưa gửi được. Câu trả lời vẫn còn đây. Hãy thử lại.")).toBeVisible();
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByRole("heading", { name: "Đã gửi cho Sam." })).toBeVisible();
  expect(seen.posts).toHaveLength(2);
});
