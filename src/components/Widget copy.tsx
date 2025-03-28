import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFrontPage } from "../context/FrontPageContext";

interface WidgetProps {
  id: string;
  type: string;
  is_new: boolean;
}

const Widget: React.FC<WidgetProps> = ({ id, type, is_new }) => {
  const { object_type, object_id } = useFrontPage();
  const [isNew, setIsNew] = useState(is_new);
  const [viewState, setViewState] = useState("collapsed");
  const [isLoading, setIsLoading] = useState(true);
  const [formHtml, setFormHtml] = useState<string>('');
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isFormProcessing, setFormProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        widget_is_valid = false;
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

  const updateWidgetDetails = (details: any) => {
    const newDetails = {
      ...widgetDetails,
      type: details?.type || widgetDetails.type,
      title: details?.title || widgetDetails.title,
    };

    let found = false;
    for (let i_widget of FRONTPAGE_BUDDY.all_widgets) {
      if (i_widget.type === newDetails.type) {
        found = true;
        newDetails.description = i_widget.description;
        newDetails.icon = i_widget.icon;
        break;
      }
    }
    if (!found) {
      setIsValid(true);
    }
    setWidgetDetails(newDetails);
  };

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
          throw new Error("Failed to fetch rows");
        }
        const jsonRes = await response.json();
        if (!jsonRes.data || Object.keys(jsonRes.data).length === 0) {
          setIsValid(false);
        } else {
          updateWidgetDetails(jsonRes.data);
        }
      } catch (err) {
        setError("Failed to fetch rows. Please try again.");
        console.error("Error fetching rows:", err);
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

  if (isLoading) {
    return (
      <div className="fpbuddy_loading">
        <Loader2 className="spinner" size={16} />
        <span>Loading...</span>
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

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
	if ( isFormProcessing ) return;

	setFormProcessing( true );
	setError(null);
    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch(
        window.FRONTPAGE_BUDDY.config.rest_url_base + "/opts",
        {
          method: "POST",
          headers: {
            'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
          },
          body: formData
        }
      );
      
	  if (!response.ok) {
		throw new Error("Failed to fetch rows");
	  }
	  
	  const jsonRes = await response.json();
	  console.log( jsonRes );
    } catch (err) {
		setError('Error updating widget. Please try again.');
      console.error('Error updating widget:', err);
    } finally {
      setIsFormLoading(false);
	}
  };

  // fetch form HTML when expanded
  useEffect(() => {
	const controller = new AbortController();

    const fetchForm = async () => {
      if (viewState !== 'expanded') return;

      setIsFormLoading(true);
	  setError(null);

      try {
		let apiUrl = new URL(FRONTPAGE_BUDDY.config.rest_url_base + '/widget-opts', window.location.origin);
		let data = {
			'object_type' : object_type,
			'object_id' : object_id,
			'widget_type' : widgetDetails.type,
			'widget_id' : widgetDetails.id,
		};
		Object.keys(data).forEach(key => apiUrl.searchParams.append(key, data[key]));

		const response = await fetch(
			apiUrl.toString(),
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': FRONTPAGE_BUDDY.config.rest_nonce
				},
				signal: controller.signal
			}
		);
		if (!response.ok) throw new Error('Failed to fetch form');

		const jsonRes = await response.json();
    	setFormHtml(jsonRes.data);
      } catch (err) {
        console.error('Error fetching form:', err);
      } finally {
        setIsFormLoading(false);
      }
    };

    fetchForm();

	return () => controller.abort();
  }, [viewState, widgetDetails.id]);

  if ("collapsed" === viewState) {
	console.log( 'inside collapsed');
    return (
      <div className="widget-content">
        <div className={`fp-widget state-preview widget-${widgetDetails.type}`}>
          <div className="fp-widget-header">
            <div 
              className="fp-widget-title"
              onClick={() => setViewState('expanded')}
            >
              <span dangerouslySetInnerHTML={{ __html: widgetDetails.icon }} />
              <span>{widgetDetails.title}</span>
            </div>
            <div className="remove_item remove_widget">
              <a href="#">
                <i className="gg-close-r"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="widget-content">
        <div className={`fp-widget state-expanded widget-${widgetDetails.type}`}>
          <div className="fp-widget-header">
            <div 
              className="fp-widget-title"
              onClick={() => setViewState('collapsed')}
            >
              <span dangerouslySetInnerHTML={{ __html: widgetDetails.icon }} />
              <span>{widgetDetails.title}</span>
            </div>
            <div className="remove_item remove_widget">
              <a href="#">
                <i className="gg-close-r"></i>
              </a>
            </div>
          </div>

		  	<div className="widget-desc">
				<i className="gg-info"></i>{widget_description}
			</div>

			<div className="widget-settings">
				{isFormLoading ? (
				<div className="fpbuddy_loading">
					<Loader2 className="spinner" size={16} />
					<span>Loading form...</span>
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
				<span className="helper"></span>
				<div className="fpbuddy_loading">
					<Loader2 className="spinner" size={16} />
					<span>Loading form...</span>
				</div>
			</div>
			)}
        </div>
      </div>
    );
  }
};

export default Widget;
