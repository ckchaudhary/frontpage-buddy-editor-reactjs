import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFrontPage } from "../context/FrontPageContext";

const AddWidget = ({ col_id, onWidgetAdd }: {col_id: string, onWidgetAdd: (type: string) => void }) => {
	const [viewState, setViewState] = useState("collapsed");

	// Add this useEffect to notify parent of state changes
	useEffect(() => {
		if (typeof window !== 'undefined') {
		  const event = new CustomEvent('widgetStateChange', {
			detail: { id: col_id, state: viewState }
		  });
		  window.dispatchEvent(event);
		}
	}, [viewState, col_id]);

	return (
		<>
		{viewState === "collapsed" ? (
				<div className="new-widget">
					<div className="expand-widgets-list">
						<a href="#" onClick={(e) => {
							e.preventDefault();
							setViewState("expanded");
						}}>
							<i className="gg-add"></i>
						</a>
					</div>
				</div>
			) : (
				<div className="choose-widget-to-add">
					<div className="collapse-widgets-list">
						<div className="fp-widget-title">{FRONTPAGE_BUDDY.lang.choose_widget}</div>
						<div className="remove_item remove_widget">
							<a href="#" onClick={(e) => {
								e.preventDefault();
								setViewState("collapsed");
							}}>
								<i className="gg-close-r"></i>
							</a>
						</div>
					</div>

					<div className="all-widgets-list">
						{FRONTPAGE_BUDDY.all_widgets.map((widget) => (
							<div 
								key={widget.type}
								className={`widget-to-add widget-${widget.type}`} 
								data-type={widget.type}
							>
								<div className="widget-choose">
									<a href="#" onClick={(e) => {
										e.preventDefault();
										onWidgetAdd(widget.type);
									}}>
										<i className="gg-add"></i>
										<span>{widget.name}</span>
									</a>
								</div>
							</div>
						))}
					</div>
				</div>
			)
		}
		</>
	);
};

export default AddWidget;
