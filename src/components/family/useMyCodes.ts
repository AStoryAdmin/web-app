/**
 * The family codes this account has made that still open a place
 * (data/familyWrites listMyCodes), shared by the Family page and the person
 * page so both say the same thing: somebody with a live code is "invited ·
 * waiting for them" (docs/BAOS-STANDARD.md rule 29), wherever they appear.
 * A failed fetch is a failure, never an empty list.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { listMyCodes, type MyCode } from "../../data/familyWrites";

/** The last list this session: an in-app visit draws with it at once, so the tree never refits when the codes come back. */
let last: MyCode[] | null = null;
/** Forget the list (sign-out), so the next account never starts from it. */
export function clearCodesCache() {
  last = null;
}

export function useMyCodes(enabled = true) {
  const [codes, setCodesState] = useState<MyCode[] | null>(last);
  const setCodes = useCallback((next: MyCode[] | null | ((prev: MyCode[] | null) => MyCode[] | null)) => {
    setCodesState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      last = value;
      return value;
    });
  }, []);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => new Date(0));
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    listMyCodes()
      .then((list) => {
        if (!live) return;
        setCodes(list);
        setFailed(false);
        setNow(new Date());
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [enabled, version, setCodes]);
  const reload = useCallback(() => {
    setFailed(false);
    setVersion((v) => v + 1);
  }, []);
  /** The people (tree rows) a live code was made for. */
  const coded = useMemo(() => new Set((codes || []).map((c) => c.personId).filter((id): id is string => !!id)), [codes]);
  return { codes, setCodes, failed, reload, coded, now };
}
