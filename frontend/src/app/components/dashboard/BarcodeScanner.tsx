"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Check, Loader2, Pill, RefreshCw, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import { api } from "@/lib/api";
import { Drug } from "@/lib/types";

declare class BarcodeDetector {
  static getSupportedFormats(): Promise<string[]>;
  constructor(options?: { formats?: string[] });
  detect(source: HTMLVideoElement): Promise<Array<{
    rawValue: string;
    format: string;
    boundingBox?: DOMRectReadOnly;
  }>>;
}

type ScanState = "idle" | "unsupported" | "loading-camera" | "scanning" | "processing" | "result" | "not-found" | "error";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDrugDetected: (drug: Drug) => void;
  onUseCamera?: () => void;
}

const SUPPORTED_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "qr_code", "data_matrix", "pdf417"];

async function resolveMedicationResults(medicationName: string | null, genericName: string | null) {
  const terms = [medicationName, genericName]
    .filter((term): term is string => Boolean(term && term.trim()))
    .flatMap((term) => term.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean));

  const results: Drug[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const response = await api.drugs.search(term);
    response.data.drugs.slice(0, 5).forEach((drug) => {
      if (!seen.has(drug.rxcui)) {
        seen.add(drug.rxcui);
        results.push(drug);
      }
    });
  }

  return results.slice(0, 8);
}

export default function BarcodeScanner({ isOpen, onClose, onDrugDetected, onUseCamera }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<ScanState>("idle");
  const handlingRef = useRef(false);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [rawBarcode, setRawBarcode] = useState("");
  const [barcodeFormat, setBarcodeFormat] = useState("");
  const [detectedName, setDetectedName] = useState("");
  const [detectedGeneric, setDetectedGeneric] = useState("");
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<Drug[]>([]);
  const [isManualSearching, setIsManualSearching] = useState(false);

  const updateState = useCallback((next: ScanState) => {
    stateRef.current = next;
    setScanState(next);
  }, []);

  const stopEverything = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    handlingRef.current = false;
    setRawBarcode("");
    setBarcodeFormat("");
    setDetectedName("");
    setDetectedGeneric("");
    setSearchResults([]);
    setErrorMsg("");
    setManualQuery("");
    setManualResults([]);
    setIsManualSearching(false);
  }, []);

  const handleBarcodeFound = useCallback(async (rawValue: string, format: string) => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    stopEverything();
    updateState("processing");
    setRawBarcode(rawValue);
    setBarcodeFormat(format.replace(/_/g, "-").toUpperCase());

    try {
      const response = await api.drugs.barcode({ barcodeValue: rawValue, format });
      const medName = response.data.medicationName;
      const genName = response.data.genericName;

      if (!medName && !genName) {
        updateState("not-found");
        return;
      }

      setDetectedName(medName || "");
      setDetectedGeneric(genName || "");
      setSearchResults(await resolveMedicationResults(medName, genName));
      updateState("result");
    } catch (error) {
      updateState("error");
      setErrorMsg(error instanceof Error ? error.message : "Barcode lookup failed. Try camera label scan instead.");
    }
  }, [stopEverything, updateState]);

  const startDetectionLoop = useCallback(() => {
    async function loop() {
      if (stateRef.current !== "scanning" || !videoRef.current || !detectorRef.current || handlingRef.current) return;

      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        const first = barcodes[0];
        if (first?.rawValue && stateRef.current === "scanning") {
          await handleBarcodeFound(first.rawValue, first.format || "barcode");
          return;
        }
      } catch {
        // Continue scanning.
      }

      if (stateRef.current === "scanning") {
        frameRef.current = requestAnimationFrame(loop);
      }
    }

    frameRef.current = requestAnimationFrame(loop);
  }, [handleBarcodeFound]);

  const startCamera = useCallback(async () => {
    stopEverything();
    reset();
    updateState("loading-camera");

    if (!("BarcodeDetector" in window)) {
      updateState("unsupported");
      return;
    }

    try {
      const supported = await BarcodeDetector.getSupportedFormats();
      const formats = SUPPORTED_FORMATS.filter((format) => supported.includes(format));
      detectorRef.current = new BarcodeDetector({ formats: formats.length ? formats : undefined });

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
        await video.play();
      }

      updateState("scanning");
      startDetectionLoop();
    } catch {
      updateState("error");
      setErrorMsg("Camera access was denied or unavailable. Please allow camera access and try again.");
    }
  }, [reset, startDetectionLoop, stopEverything, updateState]);

  const handleSelect = useCallback((drug: Drug) => {
    stopEverything();
    onDrugDetected(drug);
    toast.success(`${drug.name} added to workspace`, { description: "From barcode scan" });
    onClose();
  }, [onClose, onDrugDetected, stopEverything]);

  const runManualSearch = useCallback(async () => {
    const term = manualQuery.trim();
    if (term.length < 2) {
      setErrorMsg("Enter at least 2 characters from the brand or generic ingredient.");
      return;
    }

    setIsManualSearching(true);
    try {
      const response = await api.drugs.search(term);
      setManualResults(response.data.drugs.slice(0, 8));
      if (response.data.drugs.length === 0) {
        setErrorMsg("No medication matched that text. Try the generic active ingredient printed on the pack.");
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Medication search failed.");
    } finally {
      setIsManualSearching(false);
    }
  }, [manualQuery]);

  const handleUseCamera = useCallback(() => {
    stopEverything();
    reset();
    updateState("idle");
    if (onUseCamera) {
      onUseCamera();
    } else {
      onClose();
    }
  }, [onClose, onUseCamera, reset, stopEverything, updateState]);

  const handleClose = useCallback(() => {
    stopEverything();
    reset();
    updateState("idle");
    onClose();
  }, [onClose, reset, stopEverything, updateState]);

  useEffect(() => {
    if (!isOpen) {
      stopEverything();
      return;
    }

    const timer = window.setTimeout(() => void startCamera(), 0);
    return () => {
      window.clearTimeout(timer);
      stopEverything();
    };
  }, [isOpen, startCamera, stopEverything]);

  if (!isOpen) return null;

  const isProcessing = scanState === "loading-camera" || scanState === "processing";
  const canUseCamera = scanState === "unsupported" || scanState === "not-found" || scanState === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/65 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-t-[32px] border border-border-app bg-white shadow-premium sm:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-border-app px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-blue">Barcode scan</p>
            <h3 className="text-lg font-black text-text-primary">Scan medication barcode</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-text-secondary">
              Barcode lookup is best effort. If it misses, use camera scan or type the generic name.
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
            className={`h-full w-full object-cover transition-opacity duration-300 ${scanState === "scanning" ? "opacity-100" : "opacity-0"}`}
          />

          {scanState === "scanning" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="relative h-28 w-80 max-w-[82vw] rounded-[24px] border-2 border-white/80">
                <div className="absolute inset-x-6 top-1/2 h-[2px] -translate-y-1/2 bg-medical-green shadow-[0_0_16px_rgba(76,209,55,0.9)] animate-scan-line" />
              </div>
              <div className="flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold text-white">
                <ScanLine className="h-3.5 w-3.5 text-medical-green" />
                Hold steady on the barcode
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/75">
              <Loader2 className="h-9 w-9 animate-spin text-white" />
              <p className="text-sm font-semibold text-white">
                {scanState === "loading-camera" ? "Starting camera..." : "Looking up medication..."}
              </p>
            </div>
          )}

          {(scanState === "unsupported" || scanState === "error") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <AlertTriangle className="h-10 w-10 text-warning-orange" />
              <p className="text-sm font-semibold text-white">
                {scanState === "unsupported" ? "Barcode detection is not supported in this browser." : errorMsg}
              </p>
              <p className="text-xs font-medium text-white/65">Many local medicine barcodes are not indexed. Typing the generic name is often more accurate.</p>
            </div>
          )}
        </div>

        <div className="px-5 py-5">
          {(scanState === "result" || scanState === "not-found") && (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-xl border border-border-app bg-surface-app px-2.5 py-1 font-mono text-[10px] font-bold text-text-muted">
                  {barcodeFormat || "BARCODE"}
                </span>
                <span className="truncate font-mono text-xs text-text-muted">{rawBarcode}</span>
              </div>

              {scanState === "result" && (
                <>
                  <div className="mb-3 space-y-1">
                    {detectedName && (
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                        Drug: <span className="normal-case tracking-normal text-primary-blue">{detectedName}</span>
                      </p>
                    )}
                    {detectedGeneric && detectedGeneric !== detectedName && (
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">
                        Ingredient: <span className="normal-case tracking-normal text-text-primary">{detectedGeneric}</span>
                      </p>
                    )}
                  </div>

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
                    <p className="rounded-2xl bg-surface-app p-4 text-sm font-medium text-text-secondary">
                      Identified as <strong>{detectedName || detectedGeneric}</strong>, but no matching medication record was found.
                    </p>
                  )}
                </>
              )}

              {scanState === "not-found" && (
                <div className="rounded-2xl border border-warning-orange/20 bg-warning-orange/5 p-4">
                  <p className="text-sm font-black text-text-primary">Barcode not found</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-text-secondary">
                    Many Nigerian medication barcodes are not available in public drug databases. Use Camera scan or type the generic ingredient from the pack.
                  </p>
                </div>
              )}
            </div>
          )}

          {(scanState === "not-found" || scanState === "error" || scanState === "unsupported" || (scanState === "result" && searchResults.length === 0)) && (
            <div className="mb-4 rounded-[24px] border border-border-app bg-surface-app p-4">
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
          )}

          {scanState === "scanning" && (
            <p className="mb-4 rounded-2xl bg-primary-blue/5 px-4 py-3 text-xs font-semibold leading-5 text-text-secondary">
              Barcode lookup may not identify local products. If it cannot find the medicine, switch to Camera scan or type the generic ingredient name.
            </p>
          )}

          <div className="flex gap-3">
            {scanState === "scanning" && (
              <Button variant="secondary" onClick={handleClose} className="flex-1 py-3">Cancel</Button>
            )}
            {canUseCamera && (
              <Button onClick={handleUseCamera} className="flex-1 py-3">
                <Camera className="h-4 w-4" /> Use camera scan
              </Button>
            )}
            {(scanState === "result" || scanState === "not-found" || scanState === "error") && (
              <Button variant="secondary" onClick={startCamera} className="flex-1 py-3">
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            )}
            {scanState === "unsupported" && (
              <Button variant="secondary" onClick={handleClose} className="flex-1 py-3">Close</Button>
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
