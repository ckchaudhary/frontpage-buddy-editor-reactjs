import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useFrontPage } from "../context/FrontPageContext";
import Toast from './Toast';

interface WidgetProps {
  col_id: string;
  id: string;
  type: string;
  is_new: boolean;
  onUpdateOptsSuccess?: (id: string) => void;
  onWidgetDelete?: () => void;
}

const Widget: React.FC<WidgetProps> = ({ col_id, id, type, is_new, onUpdateOptsSuccess, onWidgetDelete } : WidgetProps) => {
  const { object_type, object_id } = useFrontPage();
  const [isNew, setIsNew] = useState(is_new);
  const [viewState, setViewState] = useState("collapsed");
  const [isLoading, setIsLoading] = useState(true);
  const [formHtml, setFormHtml] = useState<string>('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isFormProcessing, setFormProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Cache to store fetched HTML
  const formCache = useRef<{ [key: string]: string }>({});

  let widget_id = id || Date.now() + "_" + Math.random();
  let widget_type: string = type || "";
  let widget_title: string = "";
  let widget_description: string = "";
  let widget_icon: string = "";
  let widget_is_valid = true;

  if (widget_type) {
    widget_is_valid = false;
    for (let i_widget of FRONTPAGE_BUDDY.all_widgets) {
      if (i_widget.type === widget_type) {
        widget_title = i_widget.name;
        widget_description = i_widget.description;
        widget_icon = i_widget.icon;
        widget_is_valid = true;
        break;
      }
    }
  }

  const [widgetDetails, setWidgetDetails] = useState({
    id: widget_id,
    type: widget_type,
    title: widget_title,
    description: widget_description,
    icon: widget_icon,
  });

  const [isValid, setIsValid] = useState(widget_is_valid);

  // Add this useEffect to notify parent of state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('widgetStateChange', {
        detail: { id: col_id, state: viewState }
      });
      window.dispatchEvent(event);
    }
  }, [viewState, col_id]);

  // Fetch form when expanded for the first time
  useEffect(() => {
    if (viewState === "expanded" && !formHtml) {
      const fetchFormHtml = async () => {
        setIsFormLoading(true);
        try {
          const apiUrl = new URL(
            window.FRONTPAGE_BUDDY.config.rest_url_base + "/widget-opts",
            window.location.origin
          );
          apiUrl.searchParams.set("widget_id", widgetDetails.id);
          apiUrl.searchParams.set("object_type", object_type);
          apiUrl.searchParams.set("object_id", object_id.toString());
          apiUrl.searchParams.set("is_new", is_new);
          apiUrl.searchParams.set("widget_type", widgetDetails.type.toString());

          const response = await fetch(apiUrl.toString(), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-WP-Nonce": window.FRONTPAGE_BUDDY.config.rest_nonce,
            },
          });

          if (!response.ok) {
            setToast({ message: 'Error fetching form. Please try again.', type: 'error' });
          }

          const jsonRes = await response.json();
          formCache.current[widgetDetails.id] = jsonRes.data.html; // Cache form HTML
          setFormHtml(jsonRes.data.html);
        } catch (err) {
          setToast({ message: 'Error fetching form. Please try again.', type: 'error' });
        } finally {
          setIsFormLoading(false);
        }
      };

      if (formCache.current[widgetDetails.id]) {
        setFormHtml(formCache.current[widgetDetails.id]); // Use cached HTML
      } else {
        fetchFormHtml(); // Fetch from API
      }
    }
  }, [viewState, widgetDetails.id, object_type, object_id, formHtml]);

  useEffect(() => {
    if (formHtml && widgetDetails.type === 'richcontent' && viewState === 'expanded') {
        setTimeout(() => {
            const textarea = document.querySelector(`.widget-${widgetDetails.type}[data-id="${widgetDetails.id}"] textarea`);
            if (!textarea) return;

            // Create editor container
            const editorContainer = document.createElement('div');
            textarea.parentNode?.insertBefore(editorContainer, textarea);
            textarea.style.display = 'none';

            const quill = new window.Quill(editorContainer, {
                theme: 'snow',
                modules: {
                   	toolbar: FRONTPAGE_BUDDY.rich_content.editor_btns,
                },
                preserveWhitespace: true,
                bounds: editorContainer
            });

            // Set initial content
            quill.root.innerHTML = textarea.value;

            // Update textarea when content changes
            quill.on('text-change', () => {
                textarea.value = quill.root.innerHTML;
            });

            // Cleanup
            return () => {
                editorContainer.remove();
                textarea.style.display = 'block';
            };
        }, 0);
    }
}, [formHtml, widgetDetails.type]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const apiUrl = new URL(
          window.FRONTPAGE_BUDDY.config.rest_url_base + "/widget-details",
          window.location.origin
        );
        apiUrl.searchParams.set("object_type", object_type);
        apiUrl.searchParams.set("object_id", object_id.toString());
        apiUrl.searchParams.set("widget_id", widgetDetails.id);
        const response = await fetch(apiUrl.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": window.FRONTPAGE_BUDDY.config.rest_nonce,
          },
        });

        if (!response.ok) {
          setToast({ message: 'Error fetching detailsss. Please try again.', type: 'error' });
        }
        const jsonRes = await response.json();
        if (!jsonRes.data || Object.keys(jsonRes.data).length === 0) {
          setIsValid(false);
        } else {
			setWidgetDetails(prevDetails => {
                const newDetails = {
                    ...prevDetails,
                    ...jsonRes.data
                };
                
                // If title is empty, try to find it from all_widgets
                if (!newDetails.title && newDetails.type) {
                    const widget = FRONTPAGE_BUDDY.all_widgets.find(w => w.type === newDetails.type);
                    if (widget) {
                        newDetails.title = widget.name;
                        newDetails.description = widget.description;
                        newDetails.icon = widget.icon;
                    }
                }
                
                return newDetails;
            });
        }
      } catch (err) {
        setToast({ message: 'Error fetching details. Please try again.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    if (!isNew) {
      fetchDetails();
    } else {
      setIsLoading(false);
    }
  }, []);

  const toggleViewState = () => {
	setViewState(viewState === 'collapsed' ? 'expanded' : 'collapsed');
  };
  

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
	if ( isFormProcessing ) return;

	setFormProcessing( true );
    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch(
        window.FRONTPAGE_BUDDY.config.rest_url_base + "/widget-opts",
        {
          method: "POST",
          headers: {
            'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
          },
          body: formData
        }
      );
      
	  if (!response.ok) {
		setToast({ message: 'Error updating widget. Please try again.', type: 'error' });
	  }
	  
	  const jsonRes = await response.json();
	  if ( jsonRes.success ) {
		setIsNew(false);
		onUpdateOptsSuccess?.(widget_id);
	  }
	  setToast({ message: jsonRes.message, type: jsonRes.success ? 'success' : 'error' });
    } catch (err) {
		console.log( err );
		setToast({ message: 'Error updating widget. Please try again.', type: 'error' });
    } finally {
      setFormProcessing(false);
	}
  };

  if (isLoading) {
    return (
		<div className="widget-content">
			<div className="fpbuddy_loading">
				<Loader2 className="spinner" size={16} />
			</div>
		</div>
    );
  }

  if (!isValid) {
    return (
      <>
        <div>{FRONTPAGE_BUDDY.lang.invalid}</div>
        <div className="remove_item remove_widget">
          <a href="#"></a>
        </div>
      </>
    );
  }

  return (
	<>
		<div className="widget-content">
			<div className={`fp-widget state-${ "collapsed" === viewState ? 'preview' : 'expanded' } widget-${widgetDetails.type}`} data-id={widgetDetails.id}>
				<div className="fp-widget-header">
					<div 
					className="fp-widget-title"
					onClick={toggleViewState}
					>
						<span dangerouslySetInnerHTML={{ __html: widgetDetails.icon }} />
						<span>{widgetDetails.title}</span>
					</div>
					<div className="remove_item remove_widget">
						<a href="#" onClick={(e) => {
								e.preventDefault();
								let proceed = isNew || confirm( FRONTPAGE_BUDDY.lang.confirm_delete_widget );
								if ( proceed ){
									onWidgetDelete();
								}
							}}>
							<i className="gg-close-r"></i>
						</a>
					</div>
				</div>

				<div style={{ 
					display: viewState === 'expanded' ? 'block' : 'none'
					}}>
					<div className="widget-desc">
						<i className="gg-info"></i>{widgetDetails.description}
					</div>
				
					<div className="widget-settings">
						{isFormLoading || formHtml === '' ? (
							<div className="fpbuddy_loading">
								<Loader2 className="spinner" size={16} />
							</div>
						) : (
							<form onSubmit={handleFormSubmit}>
								<div dangerouslySetInnerHTML={{ __html: formHtml }} />
								<div className='fpwidget-submit'>
									<button type="submit">{FRONTPAGE_BUDDY.lang.update || 'Update'}</button>
									<a href="#" onClick={() => setViewState('collapsed')} className="close-widget-settings">{FRONTPAGE_BUDDY.lang.close || 'Close'}</a>
								</div>
							</form>
						)}
					</div>

					{isFormProcessing && (
						<div className="loading_overlay">
							<div className="fpbuddy_loading">
								<Loader2 className="spinner" size={16} />
							</div>
						</div>
					)}
				</div>
				
			</div>
		</div>

		{toast && (
            <Toast
                message={toast.message}
                type={toast.type}
                onDismiss={() => setToast(null)}
            />
        )}
	</>
  );
};

export default React.memo(Widget, (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
        prevProps.col_id === nextProps.col_id &&
        prevProps.id === nextProps.id &&
        prevProps.type === nextProps.type &&
        // Intentionally exclude is_new from comparison
        true
    );
});
