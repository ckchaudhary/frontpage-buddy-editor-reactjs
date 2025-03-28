import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useFrontPage } from '../context/FrontPageContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableRow } from './SortableRow';

const Layout = () => {
	const { object_type, object_id } = useFrontPage();
	const [rows, setRows] = useState<Array<Array<{col_id: string; widget_id: string, widget_type: string, is_new: boolean}>>>([]);
	const [expandedWidgets, setExpandedWidgets] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
  	const [error, setError] = useState<string | null>(null);

	const handleAddRow = (e: React.MouseEvent) => {
		e.preventDefault();
		let newRows = [...rows, [
            { col_id: `col-${rows.length}-0`, widget_id: '', widget_type: '', is_new: true },
            { col_id: `col-${rows.length}-1`, widget_id: '', widget_type: '', is_new: true },
        ]];
		setRows( newRows );
		updateLayout( newRows );
	};

	const handleDeleteRow = useCallback((rowIndex: number) => {
        setRows(currentRows => {
            const newRows = [...currentRows];
            newRows.splice(rowIndex, 1);
            updateLayout(newRows);
            return newRows;
        });
    }, []);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Add this function near other state functions
	const updateLayout = async (newRows: any[]) => {
		try {
			const apiUrl = new URL(
				window.FRONTPAGE_BUDDY.config.rest_url_base + "/layout",
				window.location.origin
			);
			const response = await fetch(apiUrl.toString(), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
				},
				body: JSON.stringify({
					object_type,
					object_id,
					layout: newRows.map(row => row.map((col: { widget_id: string }) => col.widget_id))
				})
			});

			if (!response.ok) {
				throw new Error("Failed to update layout");
			}
		} catch (err) {
			console.error("Error updating layout:", err);
		}
	};

	// Modify handleDragEnd to include the update
	const handleDragEnd = (event: any) => {
		const { active, over } = event;
		
		if (active.id !== over.id) {
			setRows((items) => {
				const oldIndex = items.findIndex((_, index) => `row-${index}` === active.id);
				const newIndex = items.findIndex((_, index) => `row-${index}` === over.id);
				
				const newRows = arrayMove(items, oldIndex, newIndex);
				updateLayout(newRows); // Add this line to persist changes
				return newRows;
			});
		}
	};

	useEffect(() => {
		const fetchRows = async () => {
		  try {
			const apiUrl = new URL(
			  window.FRONTPAGE_BUDDY.config.rest_url_base + "/layout",
			  window.location.origin
			);
			apiUrl.searchParams.set("object_type", object_type);
			apiUrl.searchParams.set("object_id", object_id);
			const response = await fetch(apiUrl.toString(), {
			  method: "GET",
			  headers: {
				"Content-Type": "application/json",
				'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
			  },
			});

			if (!response.ok) {
			  throw new Error("Failed to fetch rows");
			}
			const json_res = await response.json();
			const fetchedRows = json_res.data;
			
			if (Array.isArray(fetchedRows) && fetchedRows.length > 0) {
				// Transform the rows to include AddWidget IDs
				const transformedRows = fetchedRows.map((row: string[], rowIndex: number) => {
					const transformedRow = row.map((widget_id, colIndex) => ({
						col_id: `col-${rowIndex}-${colIndex}`,
						widget_id,
						widget_type: '',
						is_new: false,
					}));
					// If row has only one column, add an empty second column
					if (transformedRow.length < 2) {
						transformedRow.push({
							col_id: `col-${rowIndex}-1`,
							widget_id: '',
							widget_type: '',
							is_new: false,
						});
					}
					return transformedRow;
				});
				setRows(transformedRows);
			}
		  } catch (err) {
			setError("Failed to load rows. Please refresh the page.");
			console.error("Error loading rows:", err);
		  } finally {
			setIsLoading(false);
		  }
		};

		fetchRows();
	}, [object_type, object_id] );


	const handleWidgetAdd = (rowIndex: number, colIndex: number, widgetType: string) => {
		setRows(currentRows => {
            const newRows = [...currentRows];
            newRows[rowIndex][colIndex] = {
                ...newRows[rowIndex][colIndex],
                widget_id: Date.now() + "_" + Math.random(), // This will be assigned by the Widget component
                is_new: true,
				widget_type: widgetType,
            };
            return newRows;
        });
    };

	const handleWidgetOptsSuccess = useCallback((rowIndex: number, colIndex: number, widgetId: string) => {
        setRows(currentRows => {
            const newRows = [...currentRows];
            // Mutate the object directly to avoid triggering re-renders
            Object.assign(newRows[rowIndex][colIndex], { is_new: false });
			updateLayout(newRows);
            return newRows;
        });
    }, []);

	const handleWidgetDelete = useCallback((rowIndex: number, colIndex: number) => {
        setRows(currentRows => {
            const newRows = [...currentRows];
            // Mutate the object directly to avoid triggering re-renders
            Object.assign(newRows[rowIndex][colIndex], { widget_id: "" });
			updateLayout(newRows);
            return newRows;
        });
    }, []);

	// Add this effect to listen for widget state changes
	useEffect(() => {
		const handleWidgetStateChange = (event: CustomEvent) => {
		  const { id, state } = event.detail;
		  setExpandedWidgets(prev => {
			const newSet = new Set(prev);
			if (state === 'expanded') {
			  newSet.add(id);
			} else {
			  newSet.delete(id);
			}
			return newSet;
		  });
		};
	
		window.addEventListener('widgetStateChange', handleWidgetStateChange as EventListener);
		return () => {
		  window.removeEventListener('widgetStateChange', handleWidgetStateChange as EventListener);
		};
	  }, []);

	if (isLoading) {
		return (
		  <div className="fpbuddy_loading">
			<Loader2 className="spinner" size={16} />
		  </div>
		);
	}

	if (error) {
		return <div className="fpbuddy_error">{error}</div>;
	}

	return (
		<>
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={
						Array.isArray(rows) ?
						rows.map((row, index) => ({
							id: `row-${index}`,
							content: row
						})) : []
					}
					strategy={verticalListSortingStrategy}
				>
					{Array.isArray(rows) ? 
						rows.map((row, rowIndex) => (
							<SortableRow
                                key={`row-${rowIndex}-${JSON.stringify(row)}`}
                                id={`row-${rowIndex}`}
                                row={row}
                                rowIndex={rowIndex}
                                hasExpandedWidget={row.some(col => expandedWidgets.has(col.col_id))}
								onWidgetChosen={handleWidgetAdd}
								onUpdateOptsSuccess={handleWidgetOptsSuccess}
								onWidgetDelete={handleWidgetDelete}
								onRowDelete={handleDeleteRow}
                            />
						))
						: null
					}
				</SortableContext>
			</DndContext>

			<div className="row-add-new">
				<a href="#" onClick={handleAddRow}>
					<span className="gg-add"></span>
					<span>{FRONTPAGE_BUDDY.lang.add_section}</span>
				</a>
			</div>
		</>
	);
};

export default Layout;