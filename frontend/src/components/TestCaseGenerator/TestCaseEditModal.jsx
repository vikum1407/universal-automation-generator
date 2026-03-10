import React, { useState } from "react";

export default function TestCaseEditModal({ testCase, onClose, onSubmit }) {
  const [instructions, setInstructions] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Edit Test Case with AI</h3>

        <p className="modal-subtitle">
          Describe how you want this test case improved.
        </p>

        <textarea
          className="modal-textarea"
          placeholder="Example: Make steps more concise, rewrite description, improve clarity..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>

          <button
            className="modal-btn primary"
            onClick={() => onSubmit(instructions)}
            disabled={!instructions.trim()}
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
