"use client";

import { useEffect } from "react";
import { Button } from "@/components/atoms/button";

type InfoPopupProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function InfoPopup({ open, title, message, onClose }: InfoPopupProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="popup-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="popup-title" className="popup-title">
          {title}
        </p>
        <p className="popup-message">{message}</p>
        <div className="popup-actions">
          <Button type="button" variant="primary" onClick={onClose}>
            Mengerti
          </Button>
        </div>
      </div>
    </div>
  );
}
