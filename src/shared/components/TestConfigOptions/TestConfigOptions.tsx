import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  setDuration,
  setWordCount,
  setMaxErrors,
  setZenMode,
  setWordBankSlug,
  selectDuration,
  selectWordCount,
  selectMaxErrors,
  selectIsZenMode,
  selectWordBankSlug,
} from "@/features/typingConfig/state/typingConfigSlice";
import {
  apiListWordBanks,
  type WordBankSummary,
} from "@/features/typingConfig/services/wordBanksApi";
import { formatWordBankLabel } from "@/features/typingConfig/utils/formatWordBankLabel";
import { loadWordBankWords } from "@/features/typing/utils/wordBankLoader";
import { resetActiveWordPool } from "@/features/typing/utils/wordList";
import styles from "./TestConfigOptions.module.css";

const DEFAULT_BANK_LABEL = "Default";

function formatTimeInput(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0] ?? "", 10);
    const secs = parseInt(parts[1] ?? "", 10);
    if (isNaN(mins) || isNaN(secs)) return null;
    if (mins < 0 || secs < 0 || secs >= 60) return null;
    return mins * 60 + secs;
  }

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

function isDurationActive(
  configDuration: number | null,
  isZenMode: boolean,
  preset: number,
): boolean {
  return !isZenMode && configDuration === preset;
}

function isWordCountActive(
  configWordCount: number | null,
  isZenMode: boolean,
  preset: number,
): boolean {
  return !isZenMode && configWordCount === preset;
}

function isErrorActive(
  configMaxErrors: number | null,
  isZenMode: boolean,
  preset: number,
): boolean {
  return !isZenMode && configMaxErrors === preset;
}

export function TestConfigOptions() {
  const dispatch = useAppDispatch();
  const configDuration = useAppSelector(selectDuration);
  const configWordCount = useAppSelector(selectWordCount);
  const configMaxErrors = useAppSelector(selectMaxErrors);
  const isZenMode = useAppSelector(selectIsZenMode);
  const configWordBankSlug = useAppSelector(selectWordBankSlug);

  const [wordBanks, setWordBanks] = useState<WordBankSummary[]>([]);
  const [bankListError, setBankListError] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState(() =>
    configWordBankSlug === null
      ? DEFAULT_BANK_LABEL
      : formatWordBankLabel(configWordBankSlug),
  );
  const [bankListOpen, setBankListOpen] = useState(false);
  const [searchEdited, setSearchEdited] = useState(false);
  const searchEditedRef = useRef(false);
  const configWordBankSlugRef = useRef(configWordBankSlug);

  useEffect(() => {
    configWordBankSlugRef.current = configWordBankSlug;
  }, [configWordBankSlug]);

  const [customTimeInput, setCustomTimeInput] = useState("");
  const [customWordsInput, setCustomWordsInput] = useState("");
  const [customErrorsInput, setCustomErrorsInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiListWordBanks()
      .then((banks) => {
        if (cancelled) return;
        setWordBanks(banks);
        if (searchEditedRef.current) return;
        const slug = configWordBankSlugRef.current;
        const bank = banks.find((b) => b.slug === slug);
        const label =
          slug === null
            ? DEFAULT_BANK_LABEL
            : bank?.name ?? formatWordBankLabel(slug);
        setBankSearch(label);
      })
      .catch(() => {
        if (cancelled) return;
        setBankListError("Unable to load word banks.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedBank = useMemo(
    () => wordBanks.find((bank) => bank.slug === configWordBankSlug) ?? null,
    [wordBanks, configWordBankSlug],
  );

  useEffect(() => {
    if (configWordBankSlug === null) return;
    void loadWordBankWords(configWordBankSlug);
  }, [configWordBankSlug]);

  const filteredBanks = useMemo(() => {
    if (!searchEdited) return wordBanks;
    const query = bankSearch.trim().toLowerCase();
    if (query === "") return wordBanks;
    return wordBanks.filter(
      (bank) =>
        bank.name.toLowerCase().includes(query) ||
        bank.slug.toLowerCase().includes(query),
    );
  }, [wordBanks, bankSearch, searchEdited]);

  const handleSelectBank = useCallback(
    (slug: string | null, label: string) => {
      dispatch(setWordBankSlug(slug));
      setBankSearch(label);
      setBankListOpen(false);
      setSearchEdited(false);
      searchEditedRef.current = false;
      if (slug === null) {
        resetActiveWordPool();
        return;
      }
      void loadWordBankWords(slug);
    },
    [dispatch],
  );

  const handleBankSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setBankListOpen(false);
        setSearchEdited(false);
        searchEditedRef.current = false;
        setBankSearch(
          configWordBankSlug === null
            ? DEFAULT_BANK_LABEL
            : selectedBank?.name ?? formatWordBankLabel(configWordBankSlug),
        );
      }
    },
    [selectedBank, configWordBankSlug],
  );

  const handleTimePreset = useCallback(
    (seconds: number) => {
      dispatch(setDuration(seconds));
      setCustomTimeInput("");
    },
    [dispatch],
  );

  const handleCustomTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomTimeInput(e.target.value);
      const parsed = parseTimeInput(e.target.value);
      if (parsed !== null && parsed > 0) {
        dispatch(setDuration(parsed));
      }
    },
    [dispatch],
  );

  const handleCustomTimeBlur = useCallback(() => {
    if (customTimeInput.trim() === "") return;
    const parsed = parseTimeInput(customTimeInput);
    if (parsed !== null && parsed > 0) {
      dispatch(setDuration(parsed));
      setCustomTimeInput(formatTimeInput(parsed));
    } else {
      setCustomTimeInput("");
    }
  }, [customTimeInput, dispatch]);

  const handleCustomTimeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  const handleWordPreset = useCallback(
    (count: number) => {
      dispatch(setWordCount(count));
      setCustomWordsInput("");
    },
    [dispatch],
  );

  const handleCustomWordsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      setCustomWordsInput(raw);
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        dispatch(setWordCount(num));
      }
    },
    [dispatch],
  );

  const handleCustomWordsBlur = useCallback(() => {
    if (customWordsInput.trim() === "") return;
    const num = parseInt(customWordsInput, 10);
    if (!isNaN(num) && num > 0) {
      dispatch(setWordCount(num));
      setCustomWordsInput(String(num));
    } else {
      setCustomWordsInput("");
    }
  }, [customWordsInput, dispatch]);

  const handleCustomWordsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  const handleErrorsPreset = useCallback(
    (count: number) => {
      dispatch(setMaxErrors(count));
      setCustomErrorsInput("");
    },
    [dispatch],
  );

  const handleCustomErrorsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      setCustomErrorsInput(raw);
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        dispatch(setMaxErrors(num));
      }
    },
    [dispatch],
  );

  const handleCustomErrorsBlur = useCallback(() => {
    if (customErrorsInput.trim() === "") return;
    const num = parseInt(customErrorsInput, 10);
    if (!isNaN(num) && num > 0) {
      dispatch(setMaxErrors(num));
      setCustomErrorsInput(String(num));
    } else {
      setCustomErrorsInput("");
    }
  }, [customErrorsInput, dispatch]);

  const handleCustomErrorsKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur();
      }
    },
    [],
  );

  const handleZenToggle = useCallback(() => {
    dispatch(setZenMode(true));
  }, [dispatch]);

  return (
    <div className={styles.config}>
      <div className={styles.section}>
        <span className={styles.label}>Time Limit</span>
        <div className={styles.options}>
          {[
            { value: 30, label: "30s" },
            { value: 60, label: "1m" },
            { value: 300, label: "5m" },
            { value: 900, label: "15m" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.presetBtn} ${isDurationActive(configDuration, isZenMode, value) ? styles.active : ""}`}
              onClick={() => handleTimePreset(value)}
            >
              {label}
            </button>
          ))}
          <input
            type="text"
            className={styles.customInput}
            placeholder="mm:ss"
            value={customTimeInput}
            onChange={handleCustomTimeChange}
            onBlur={handleCustomTimeBlur}
            onKeyDown={handleCustomTimeKeyDown}
            aria-label="Custom time (minutes:seconds)"
          />
          <button
            type="button"
            className={`${styles.presetBtn} ${configDuration === null ? styles.active : ""}`}
            onClick={() => {
              dispatch(setDuration(null));
              setCustomTimeInput("");
            }}
          >
            None
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Word Limit</span>
        <div className={styles.options}>
          {[25, 50, 75, 100].map((w) => (
            <button
              key={w}
              type="button"
              className={`${styles.presetBtn} ${isWordCountActive(configWordCount, isZenMode, w) ? styles.active : ""}`}
              onClick={() => handleWordPreset(w)}
            >
              {w}
            </button>
          ))}
          <input
            type="text"
            className={styles.customInput}
            placeholder="Custom"
            value={customWordsInput}
            onChange={handleCustomWordsChange}
            onBlur={handleCustomWordsBlur}
            onKeyDown={handleCustomWordsKeyDown}
            aria-label="Custom word count"
          />
          <button
            type="button"
            className={`${styles.presetBtn} ${configWordCount === null ? styles.active : ""}`}
            onClick={() => {
              dispatch(setWordCount(null));
              setCustomWordsInput("");
            }}
          >
            None
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Max Errors</span>
        <div className={styles.options}>
          {[1, 3, 5, 10].map((e) => (
            <button
              key={e}
              type="button"
              className={`${styles.presetBtn} ${isErrorActive(configMaxErrors, isZenMode, e) ? styles.active : ""}`}
              onClick={() => handleErrorsPreset(e)}
            >
              {e}
            </button>
          ))}
          <input
            type="text"
            className={styles.customInput}
            placeholder="Custom"
            value={customErrorsInput}
            onChange={handleCustomErrorsChange}
            onBlur={handleCustomErrorsBlur}
            onKeyDown={handleCustomErrorsKeyDown}
            aria-label="Custom max errors"
          />
          <button
            type="button"
            className={`${styles.presetBtn} ${configMaxErrors === null ? styles.active : ""}`}
            onClick={() => {
              dispatch(setMaxErrors(null));
              setCustomErrorsInput("");
            }}
          >
            None
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Word Bank</span>
        <div className={styles.bankGroup}>
          <input
            type="text"
            className={styles.bankInput}
            placeholder="Search word banks..."
            aria-label="Search word banks"
            value={bankSearch}
            onChange={(e) => {
              setSearchEdited(true);
              searchEditedRef.current = true;
              setBankSearch(e.target.value);
              setBankListOpen(true);
            }}
            onFocus={(e) => {
              e.target.select();
              setBankListOpen(true);
            }}
            onBlur={() => setBankListOpen(false)}
            onKeyDown={handleBankSearchKeyDown}
          />
          {bankListOpen && !bankListError && (
            <ul className={styles.bankList} role="listbox">
              {filteredBanks.map((bank) => (
                <li
                  key={bank.slug}
                  role="option"
                  aria-selected={configWordBankSlug === bank.slug}
                >
                  <button
                    type="button"
                    className={`${styles.presetBtn} ${configWordBankSlug === bank.slug ? styles.active : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectBank(bank.slug, bank.name)}
                  >
                    {bank.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {bankListError !== null && (
            <span className={styles.errorHint}>{bankListError}</span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <button
          type="button"
          className={`${styles.presetBtn} ${isZenMode ? styles.active : ""}`}
          onClick={handleZenToggle}
        >
          Zen Mode
        </button>
      </div>
    </div>
  );
}
