// src/components/MembersList.tsx
import { AnimatePresence, motion } from "framer-motion";
import type { Member } from "../../types";

interface MembersListProps {
  isOpen: boolean;
  members: Member[];
  onClose: () => void;
  canRemove: boolean; // 👈 host only
  onRemoveMember: (member: Member) => void;
}

export default function MembersList({
  isOpen,
  members,
  onClose,
  canRemove,
  onRemoveMember,
}: MembersListProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-999 flex items-center justify-center bg-black/40"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="members-dialog-title"
            className="bg-white rounded-lg shadow-xl max-w-sm w-[90%] max-h-[70vh] flex flex-col"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2
                id="members-dialog-title"
                className="text-sm font-semibold text-gray-800"
              >
                Session Members ({members.length})
              </h2>
              <button
                type="button"
                aria-label="Close member list"
                onClick={onClose}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClose();
                  }
                }}
                className="text-gray-500 hover:text-gray-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-4 py-3 overflow-y-auto text-sm">
              {members.length === 0 ? (
                <p className="text-gray-500">No members yet.</p>
              ) : (
                <ul className="space-y-1">
                  {members.map((m) => (
                    <li
                      key={m.uid}
                      className="flex items-center justify-between border-b border-gray-100 last:border-b-0 py-1.5"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {m.nickname || "Unnamed user"}
                        </span>
                        {m.isHost && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            Host
                          </span>
                        )}
                      </div>

                      {canRemove && !m.isHost && (
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50 transition"
                          onClick={() => onRemoveMember(m)}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
