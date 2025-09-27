// components/ConfirmArchiveModal.jsx
export default function ConfirmArchiveModal({
    open, name, preview, onCancel, onConfirm, busy
  }) {
    if (!open) return null;
    const affected = preview?.affectedTasks ?? 0;
    const resCount = preview?.resourceCount ?? 0;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
        <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
          <h3 className="text-lg font-semibold">Delete this Asset?</h3>
  
          <p className="mt-2 text-sm text-gray-600">
            Deleting this Asset. Resources of this Asset will be removed from all
            <span className="font-medium"> non-completed</span> tasks.
          </p>
  
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <ul className="list-disc ml-5">
              <li><span className="font-medium">{resCount}</span> resource(s) belong to this Asset.</li>
              <li><span className="font-medium">{affected}</span> active task(s) will lose these resource links.</li>
            </ul>
          </div>
  
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={onConfirm} disabled={busy}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  