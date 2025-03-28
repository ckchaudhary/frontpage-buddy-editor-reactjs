import React, { useState, useEffect } from "react";
import {
  Layout,
  LayoutIcon as LayoutsIcon,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";

interface Row {
  id: string;
  columns: [string, string];
}

function App() {
  const _globals: object = window.FRONTPAGE_BUDDY;
  const [rows, setRows] = useState<Row[]>([]);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLayoutData();
  }, []);

  const loadLayoutData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiUrl: URL = new URL(
        _globals.config.rest_url_base + "/layout",
        window.location.origin
      );
      const params: object = {
        object_type: _globals.object_type,
        object_id: _globals.object_id
      };
	  Object.keys(params).forEach(key => apiUrl.searchParams.append(key, params[key]));

      const response = await fetch(
		apiUrl.toString(),
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': _globals.config.rest_nonce
			},
		}
		);

      if (!response.ok) {
        throw new Error("Failed to load layout data");
      }

      let res = await response.json();
	  if ( res.data.length ) {
		res.data = res.data.map(
			( columns: [string, string], index: number ) => ({
				id: (index + 1).toString(),
				columns: columns
			})
		);
	  }
	  setRows(res.data);
    } catch (err) {
      setError("Failed to load layout data. Please refresh the page.");
      console.error("Error loading layout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLayoutData = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const response = await fetch("/wp-json/my-plugin/v1/layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": (window as any).wpApiSettings.nonce,
        },
        body: JSON.stringify({ rows }),
      });

      if (!response.ok) {
        throw new Error("Failed to save layout data");
      }
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      console.error("Error saving layout:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        columns: ["Column 1", "Column 2"],
      },
    ]);
  };

  const deleteRow = async (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const updateColumn = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex].columns[colIndex] = value;
    setRows(newRows);
  };

  const handleDragStart = (index: number) => {
    setDraggedRowIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedRowIndex === null) return;

    const newRows = [...rows];
    const draggedRow = newRows[draggedRowIndex];
    newRows.splice(draggedRowIndex, 1);
    newRows.splice(index, 0, draggedRow);
    setRows(newRows);
    setDraggedRowIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedRowIndex(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  return (
    <div className="layout-editor">
      <div className="header">
        <h1 className="title">
          <Layout size={24} />
          Layout Editor
        </h1>
        <div className="button-group">
          <button onClick={addRow} className="button button-primary">
            <LayoutsIcon size={16} />
            Add Row
          </button>
          <button
            onClick={saveLayoutData}
            disabled={isSaving}
            className="button button-success"
          >
            {isSaving ? (
              <Loader2 size={16} className="spinner" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="rows">
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            draggable
            onDragStart={() => handleDragStart(rowIndex)}
            onDragOver={(e) => handleDragOver(e, rowIndex)}
            onDragEnd={handleDragEnd}
            className="row"
          >
            <div className="row-content">
              <div className="columns">
                {row.columns.map((col, colIndex) => (
                  <input
                    key={colIndex}
                    type="text"
                    value={col}
                    onChange={(e) =>
                      updateColumn(rowIndex, colIndex, e.target.value)
                    }
                    className="column-input"
                    placeholder={`Column ${colIndex + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => deleteRow(rowIndex)}
                className="delete-button"
                title="Delete row"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="empty-state">
          No rows added yet. Click "Add Row" to begin.
        </div>
      )}
    </div>
  );
}

export default App;
