import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type AlertType = "regular" | "error";

interface AlertProps {
  message: string;
  type: AlertType;
  durationMs?: number;
}

export default function Alert({
  message,
  type,
  durationMs = 5000,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [visible, durationMs]);

  const borderColor = type === "error" ? "#ef4444" : "#facc15";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: "16px",
            // left: "50%",
            // transform: "translateX(-50%)",
            backgroundColor: "#fff",
            color: "#111827",
            padding: "10px 16px",
            minWidth: "280px",
            maxWidth: "90vw",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            borderBottom: `4px solid ${borderColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 9999,
            fontSize: "0.9rem",
          }}
        >
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            style={{
              // marginLeft: "12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "1.1rem",
              lineHeight: 1,
            }}
            aria-label="Close alert"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
