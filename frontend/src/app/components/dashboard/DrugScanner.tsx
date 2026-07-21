"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, Loader2, Pill, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import { api } from "@/lib/api";
import { Drug } from "@/lib/types";

type ScanState = "idle" | "loading-camera" | "streaming" | "processing" | "result" | "error";
type ScanDetection = {
  brand: string;
  generic: string;
  ocrError?: string;
  ocrText?: string;
};

interface DrugScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDrugDetected: (drug: Drug) => void;
}

const LABEL_PRODUCTS = [
  {
    pattern: /\b(?:arte\s*quick|artequick|[a-z]{2,}\s+quick)\b|(?:artemisinin.*piperaquine|piperaquine.*artemisinin)/i,
    brand: "Artequick",
    generic: "Artemisinin + Piperaquine",
  },
  {
    pattern: /\b(?:inbu(?:[-\s]?400)?|ibuprofen)\b/i,
    brand: "Inbu-400",
    generic: "Ibuprofen",
  },
  {
    pattern: /\b(?:acycor|acylor)\s*plus\b/i,
    brand: "Acylor Plus",
    generic: "Aceclofenac + Paracetamol",
  },
  {
    pattern: /\baceclofenac\s*(?:&|and|\+)\s*paracetamol\b/i,
    brand: "Acylor Plus",
    generic: "Aceclofenac + Paracetamol",
  },
  {
    pattern: /\bferoglobin(?:\s*b12)?\b/i,
    brand: "Feroglobin B12",
    generic: "Ferrous Sulfate + Folic Acid + Vitamin B12",
  },
  {
    pattern: /\bsynriam\b/i,
    brand: "Synriam",
    generic: "Arterolane + Piperaquine",
  },
  {
    pattern: /\b(?:coartem|lonart|amatem|lokmal|lumartem)\b/i,
    brand: "Artemether Lumefantrine",
    generic: "Artemether + Lumefantrine",
  },
  {
    pattern: /\bampiclox\b/i,
    brand: "Ampiclox",
    generic: "Ampicillin + Cloxacillin",
  },
  {
    pattern: /\bseptrin\b/i,
    brand: "Septrin",
    generic: "Trimethoprim-Sulfamethoxazole",
  },
  {
    pattern: /\b(?:panadol|emzor paracetamol|calpol)\b/i,
    brand: "Paracetamol product",
    generic: "Paracetamol",
  },
];

function detectMedicationFromLabelText(text: string): ScanDetection | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const product = LABEL_PRODUCTS.find((item) => item.pattern.test(normalized));
  if (product) {
    return {
      brand: product.brand,
      generic: product.generic,
      ocrText: text,
    };
  }

  return null;
}

function extractSearchableLabelText(text = "") {
  const dosageWords = /\b(tablets?|capsules?|caplets?|syrups?|suspension|cream|ointment|injection|injectable|drops?|solution|oral|film coated|mg|ml|iu|bp|usp|ph\.?e?ur)\b/gi;

  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(dosageWords, " ")
        .replace(/\b\d+(?:\.\d+)?\b/g, " ")
        .replace(/[^a-zA-Z0-9&+ -]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => /[a-zA-Z]{4,}/.test(line) && line.length <= 60)
    .sort((a, b) => a.split(" ").length - b.split(" ").length || b.length - a.length)[0] || "";
}

async function extractTextWithFreeOcr(dataUrl: string) {
  const tesseract = await import("tesseract.js");
  const result = await tesseract.recognize(dataUrl, "eng", {
    logger: () => undefined,
  });

  return result.data.text.trim();
}

async function scanImage(dataUrl: string): Promise<ScanDetection> {
  const base64 = dataUrl.split(",")[1];
  const response = await api.drugs.scan({ image: base64, mimeType: "image/jpeg" });
  const backendDetection = {
    brand: response.data.medicationName?.trim() || "UNKNOWN",
    generic: response.data.genericName?.trim() || "UNKNOWN",
    ocrError: response.data.ocrError,
    ocrText: response.data.ocrText,
  };
  const knownBackendDetection = detectMedicationFromLabelText(
    `${backendDetection.brand} ${backendDetection.generic} ${backendDetection.ocrText || ""}`
  );

  if (knownBackendDetection) {
    return {
      ...knownBackendDetection,
      ocrError: backendDetection.ocrError,
      ocrText: backendDetection.ocrText,
    };
  }

  if (isKnownMedicationText(backendDetection.generic)) {
    return backendDetection;
  }

  try {
    const freeOcrText = await extractTextWithFreeOcr(dataUrl);
    const localDetection = detectMedicationFromLabelText(freeOcrText);

    if (localDetection) {
      return {
        ...localDetection,
        ocrError: backendDetection.ocrError,
      };
    }

    const searchableLabelText = extractSearchableLabelText(freeOcrText);
    if (searchableLabelText) {
      return {
        brand: searchableLabelText,
        generic: "UNKNOWN",
        ocrError: backendDetection.ocrError,
        ocrText: freeOcrText,
      };
    }

    return {
      ...backendDetection,
      ocrText: freeOcrText || backendDetection.ocrText,
    };
  } catch {
    return backendDetection;
  }
}

function isKnownMedicationText(value: string) {
  const normalized = value.trim().toLowerCase();
  return Boolean(value) && !["unknown", "json", "brand", "generic", "null", "undefined"].includes(normalized) && normalized.length >= 4;
}

async function findDrugs(brand: string, generic: string) {
  const terms = [
    ...(isKnownMedicationText(brand) ? [brand] : []),
    ...(isKnownMedicationText(generic) ? generic.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean) : []),
  ];

  const results: Drug[] = [];
  const seen = new Set<string>();
  let matchedBy: "brand" | "generic" = "brand";

  for (const [index, term] of terms.entries()) {
    const response = await api.drugs.search(term);
    response.data.drugs.slice(0, 5).forEach((drug) => {
      if (!seen.has(drug.rxcui)) {
        seen.add(drug.rxcui);
        results.push(drug);
      }
    });
    if (index > 0 && results.length > 0) matchedBy = "generic";
  }

  return { results: results.slice(0, 8), matchedBy };
}

function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, targetWidth = 1600) {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return null;

  const scale = Math.min(1, targetWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.95);
}

export default function DrugScanner({ isOpen, onClose, onDrugDetected }: DrugScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const autoIntervalRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const stateRef = useRef<ScanState>("idle");

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedBrand, setDetectedBrand] = useState("");
  const [detectedGeneric, setDetectedGeneric] = useState("");
  const [matchedBy, setMatchedBy] = useState<"brand" | "generic">("brand");
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<Drug[]>([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  const updateState = useCallback((next: ScanState) => {
    stateRef.current = next;
    setScanState(next);
  }, []);

  const clearAutoScan = useCallback(() => {
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    if (autoIntervalRef.current) window.clearInterval(autoIntervalRef.current);
    autoTimerRef.current = null;
    autoIntervalRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    clearAutoScan();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [clearAutoScan]);

  const resetResultState = useCallback(() => {
    setCapturedImage(null);
    setDetectedBrand("");
    setDetectedGeneric("");
    setSearchResults([]);
    setErrorMsg("");
    setMatchedBy("brand");
    setManualQuery("");
    setManualResults([]);
    setIsManualSearching(false);
  }, []);

  const presentScanResult = useCallback(async (dataUrl: string, brand: string, generic: string, ocrError?: string, ocrText?: string) => {
    clearAutoScan();
    stopCamera();
    updateState("processing");
    setCapturedImage(dataUrl);

    const brandKnown = isKnownMedicationText(brand);
    const genericKnown = isKnownMedicationText(generic);

    if (!brandKnown && !genericKnown) {
      updateState("error");
      const fallbackQuery = extractSearchableLabelText(ocrText);
      if (fallbackQuery) setManualQuery(fallbackQuery);
      setErrorMsg(
        fallbackQuery
          ? "The free OCR read some label text. Review or edit the search below to find the medication."
          : ocrError || "The scanner could not read the medication name clearly. Search the visible brand or active ingredient below."
      );
      return;
    }

    setDetectedBrand(brandKnown ? brand : "");
    setDetectedGeneric(genericKnown ? generic : "");

    try {
      const match = await findDrugs(brand, generic);
      setMatchedBy(match.matchedBy);
      setSearchResults(match.results);
      updateState("result");
    } catch {
      updateState("error");
      setErrorMsg("The label was read, but medication search failed. Try searching manually by generic name.");
    }
  }, [clearAutoScan, stopCamera, updateState]);

  const runAutoScan = useCallback(async () => {
    if (busyRef.current || stateRef.current !== "streaming") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    busyRef.current = true;
    try {
      const dataUrl = captureFrame(video, canvas);
      if (!dataUrl) return;

      const { brand, generic, ocrError, ocrText } = await scanImage(dataUrl);
      if ((isKnownMedicationText(brand) || isKnownMedicationText(generic)) && stateRef.current === "streaming") {
        await presentScanResult(dataUrl, brand, generic, ocrError, ocrText);
      }
    } catch {
      // Keep the stream running. Manual capture remains available.
    } finally {
      busyRef.current = false;
    }
  }, [presentScanResult]);

  const startCamera = useCallback(async () => {
    stopCamera();
    resetResultState();
    busyRef.current = false;
    updateState("loading-camera");

    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));

      streamRef.current = stream;
      const video = videoRef.current;

      if (video) {
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) resolve();
          else video.onloadedmetadata = () => resolve();
        });
        await video.play();
      }

      updateState("streaming");
      autoTimerRef.current = window.setTimeout(() => {
        autoIntervalRef.current = window.setInterval(() => void runAutoScan(), 4500);
      }, 3500);
    } catch {
      updateState("error");
      setErrorMsg("Camera access was denied or unavailable. Please allow camera access and try again.");
    }
  }, [resetResultState, runAutoScan, stopCamera, updateState]);

  const captureManually = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || stateRef.current !== "streaming") return;

    const dataUrl = captureFrame(video, canvas);
    if (!dataUrl) {
      updateState("error");
      setErrorMsg("Camera is not ready yet. Wait a moment and try again.");
      return;
    }

    try {
      updateState("processing");
      setCapturedImage(dataUrl);
      stopCamera();
      const { brand, generic, ocrError, ocrText } = await scanImage(dataUrl);
      await presentScanResult(dataUrl, brand, generic, ocrError, ocrText);
    } catch {
      updateState("error");
      setErrorMsg("Failed to identify the medication. Try capturing the label more clearly.");
    }
  }, [presentScanResult, stopCamera, updateState]);

  const handleSelect = useCallback((drug: Drug) => {
    stopCamera();
    onDrugDetected(drug);
    toast.success(`${drug.name} added to workspace`, { description: "From camera scan" });
    onClose();
  }, [onClose, onDrugDetected, stopCamera]);

  const runManualSearch = useCallback(async () => {
    const term = manualQuery.trim();
    if (term.length < 2) {
      setErrorMsg("Enter at least 2 characters from the brand or active ingredient.");
      return;
    }

    setIsManualSearching(true);
    try {
      const response = await api.drugs.search(term);
      setManualResults(response.data.drugs.slice(0, 8));
      if (response.data.drugs.length === 0) {
        setErrorMsg("No medication matched that text. Try the generic active ingredient if it is visible.");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Medication search failed.");
    } finally {
      setIsManualSearching(false);
    }
  }, [manualQuery]);

  const handleClose = useCallback(() => {
    stopCamera();
    resetResultState();
    updateState("idle");
    onClose();
  }, [onClose, resetResultState, stopCamera, updateState]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    const timer = window.setTimeout(() => void startCamera(), 0);
    return () => {
      window.clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const isProcessing = scanState === "loading-camera" || scanState === "processing";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/65 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[32px] border border-border-app bg-white shadow-premium sm:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-border-app px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-blue">Camera scan</p>
            <h3 className="text-lg font-black text-text-primary">Scan medication label</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-text-secondary">
              Best effort OCR. If the scan is wrong, type the generic ingredient name from the pack.
            </p>
          </div>
          <button onClick={handleClose} className="rounded-2xl border border-border-app p-2 text-text-muted hover:bg-surface-app" aria-label="Close scanner">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-300 ${scanState === "streaming" ? "opacity-100" : "opacity-0"}`}
          />

          {capturedImage && (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${capturedImage})` }} />
          )}

          {scanState === "streaming" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative h-44 w-72 rounded-[28px] border-2 border-white/80">
                <div className="absolute inset-x-6 top-1/2 h-[2px] -translate-y-1/2 bg-medical-green shadow-[0_0_16px_rgba(76,209,55,0.9)] animate-scan-line" />
              </div>
              <div className="rounded-full bg-black/55 px-4 py-2 text-center text-xs font-semibold text-white">
                Keep the brand and active ingredient text inside the frame
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/75">
              <Loader2 className="h-9 w-9 animate-spin text-white" />
              <p className="text-sm font-semibold text-white">
                {scanState === "loading-camera" ? "Starting camera..." : "Identifying medication..."}
              </p>
            </div>
          )}

          {scanState === "error" && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <AlertTriangle className="h-10 w-10 text-warning-orange" />
              <p className="text-sm font-semibold text-white">{errorMsg}</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="px-5 py-5">
          {scanState === "streaming" && (
            <p className="mb-4 rounded-2xl bg-primary-blue/5 px-4 py-3 text-xs font-semibold leading-5 text-text-secondary">
              Camera scan may misread stylized Nigerian medicine packs. For best results, capture sharp label text or type the generic name manually.
            </p>
          )}

          {scanState === "result" && (
            <div className="mb-4">
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
                {detectedBrand && (
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                    Brand: <span className="normal-case tracking-normal text-primary-blue">{detectedBrand}</span>
                  </p>
                )}
                {detectedGeneric && (
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                    Ingredient: <span className="normal-case tracking-normal text-text-primary">{detectedGeneric}</span>
                  </p>
                )}
              </div>
              {matchedBy === "generic" && searchResults.length > 0 && (
                <p className="mb-2 text-xs font-semibold text-medical-green">Matched by active ingredient.</p>
              )}

              {searchResults.length > 0 ? (
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {searchResults.map((drug) => (
                    <button
                      key={drug.rxcui}
                      type="button"
                      onClick={() => handleSelect(drug)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-border-app bg-surface-app px-4 py-3 text-left transition hover:border-primary-blue/40 hover:bg-primary-blue/5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue">
                        <Pill className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-text-primary">{drug.name}</span>
                        {drug.aliases && drug.aliases.length > 0 && (
                          <span className="block truncate text-xs font-medium text-text-muted">{drug.aliases.slice(0, 3).join(", ")}</span>
                        )}
                      </span>
                      <Check className="h-4 w-4 shrink-0 text-primary-blue" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-app p-4 text-sm font-medium text-text-secondary">
                  No database match for <strong>{detectedBrand || detectedGeneric}</strong>. Type the generic ingredient name from the label for better accuracy.
                </div>
              )}
            </div>
          )}

          {scanState === "error" && capturedImage && (
            <div className="mb-4 space-y-3">
              <p className="rounded-2xl border border-warning-orange/20 bg-warning-orange/5 px-4 py-3 text-sm font-semibold text-text-primary">
                {errorMsg}
              </p>
              <div className="rounded-[24px] border border-border-app bg-surface-app p-4">
                <label className="text-xs font-black uppercase tracking-wide text-text-muted">Type brand or generic name</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={manualQuery}
                    onChange={(event) => setManualQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void runManualSearch();
                      }
                    }}
                    placeholder="e.g. ibuprofen, artemisinin, paracetamol"
                    className="min-w-0 flex-1 rounded-2xl border border-border-app bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-primary-blue"
                  />
                  <Button type="button" onClick={runManualSearch} disabled={isManualSearching} className="px-4 py-3">
                    {isManualSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>

                {manualResults.length > 0 && (
                  <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                    {manualResults.map((drug) => (
                      <button
                        key={drug.rxcui}
                        type="button"
                        onClick={() => handleSelect(drug)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border-app bg-white px-4 py-3 text-left transition hover:border-primary-blue/40 hover:bg-primary-blue/5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-blue/10 text-primary-blue">
                          <Pill className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-black text-text-primary">{drug.name}</span>
                          {drug.aliases && drug.aliases.length > 0 && (
                            <span className="block truncate text-xs font-medium text-text-muted">{drug.aliases.slice(0, 3).join(", ")}</span>
                          )}
                        </span>
                        <Check className="h-4 w-4 shrink-0 text-primary-blue" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {scanState === "streaming" && (
              <>
                <Button variant="secondary" onClick={handleClose} className="flex-1 py-3">Cancel</Button>
                <Button onClick={captureManually} className="flex-1 py-3">
                  <Camera className="h-4 w-4" /> Capture
                </Button>
              </>
            )}
            {(scanState === "result" || scanState === "error") && (
              <Button variant="secondary" onClick={startCamera} className="flex-1 py-3">
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            )}
            {(scanState === "loading-camera" || scanState === "processing") && (
              <Button variant="secondary" onClick={handleClose} className="flex-1 py-3" disabled={scanState === "processing"}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
