import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ErrorBoundary from "./ErrorBoundary";
import Widget from "./Widget";
import AddWidget from "./AddWidget";

interface SortableRowProps {
    id: string;
    row: Array<{col_id: string; widget_id: string, widget_type: string, is_new: boolean}>;
    rowIndex: number;
    hasExpandedWidget: boolean;
	onWidgetChosen: (rowIndex: number, colIndex: number, widgetType: string) => void;
	onUpdateOptsSuccess: (rowIndex: number, colIndex: number, widgetId: string) => void;
	onWidgetDelete: (rowIndex: number, colIndex: number) => void;
	onRowDelete: (rowIndex: number) => void;
}

export const SortableRow = ({ id, row, rowIndex, hasExpandedWidget, onWidgetChosen, onUpdateOptsSuccess, onWidgetDelete, onRowDelete }: SortableRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const classNames = [
        "lrow",
        "row-content",
        row.length > 1 ? 'lcol-2' : 'lcol-1'
    ].join(" ");

    return (
        <div ref={setNodeRef} style={style} className={classNames}>
            <div className="row-actions">
                <div className="fp-mover" {...attributes} {...listeners}>
                    <i className="gg-select"></i>
                    <span>{FRONTPAGE_BUDDY.lang.drag_move}</span>
                </div>
                <div className="remove_item remove_row">
					<a href="#" onClick={(e) => {
							e.preventDefault();
							let proceed = confirm( FRONTPAGE_BUDDY.lang.confirm_delete_section );
							if ( proceed ){
								onRowDelete( rowIndex );
							}
						}}>
                        <i className="gg-close-r"></i>
                    </a>
                </div>
            </div>

            <div className={`row-contents ${hasExpandedWidget ? 'dblock' : ''}`}>
                {(() => {
                    let col_count = 0;
                    const columns = row.map((column, colIndex) => {
                        col_count++;
                        return (
                            <div className="lcol" key={colIndex}>
                                {column.widget_id !== '' ? (
                                    <ErrorBoundary>
                                        <Widget 
											col_id={column.col_id} 
											id={column.widget_id} 
											type={column.widget_type} 
											is_new={column.is_new} 
											onUpdateOptsSuccess={(widgetId)=>{
												onUpdateOptsSuccess(rowIndex, colIndex, widgetId);
											}}
											onWidgetDelete={()=>{
												onWidgetDelete(rowIndex, colIndex);
											}}
										/>
                                    </ErrorBoundary>
                                ) : (
                                    <AddWidget 
										col_id={column.col_id} 
										onWidgetAdd={(widgetType)=>{
											onWidgetChosen(rowIndex, colIndex, widgetType);
										}}
									/>
                                )}
                            </div>
                        );
                    });

					/*
                    if (col_count < 2) {
                        columns.push(
                            <div className="lcol" key="empty-col">
                                <AddWidget />
                            </div>
                        );
                    }
					*/

                    return columns;
                })()}
            </div>
        </div>
    );
};