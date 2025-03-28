import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFrontPage } from '../context/FrontPageContext';

const Enabler = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { object_type, object_id } = useFrontPage();

  useEffect(() => {
    const fetchEnabledStatus = async () => {
      try {
        const apiUrl = new URL(
          window.FRONTPAGE_BUDDY.config.rest_url_base + "/status",
          window.location.origin
        );
        
        apiUrl.searchParams.append('object_type', object_type);
        apiUrl.searchParams.append('object_id', object_id);

        const response = await fetch(apiUrl.toString(), {
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        setIsEnabled(data.data);
      } catch (err) {
        setError('Failed to load status. Please refresh the page.');
        console.error('Error loading status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnabledStatus();
  }, [object_type, object_id]);


  const handleStatusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
	try {
	  const newValue = e.target.checked;
	  setIsEnabled(newValue); // Optimistically update UI
  
	  const apiUrl = new URL(
		window.FRONTPAGE_BUDDY.config.rest_url_base + "/status",
		window.location.origin
	  );
	  
	  const response = await fetch(apiUrl.toString(), {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		  'X-WP-Nonce': window.FRONTPAGE_BUDDY.config.rest_nonce
		},
		body: JSON.stringify({
		  object_type,
		  object_id,
		  updated_status: ( newValue ? 'yes' : 'no' )
		})
	  });
  
	  if (!response.ok) {
		throw new Error('Failed to update status');
	  }
	} catch (err) {
	  setIsEnabled(!e.target.checked); // Revert on error
	  setError('Failed to update status. Please try again.');
	  console.error('Error updating status:', err);
	}
  };

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
    <div className="fpbuddy_enable_fp fpbuddy_wrapper">
      <div className="fpbuddy_container">
        <div className="fpbuddy_content">
			{ !isEnabled && (
			  <div className="fpbuddy_fpstatus">
				<p className="alert alert-warning">
				  A custom front page for your profile is not enabled yet. Before enabling it, make sure you have added some content for the front page.
				</p>
			  </div>
			)}
          
          <p className="fpbuddy-switch-inline-parent">
            <span><strong>Enable custom front page?</strong></span>
			<label className="fpbuddy-switch">
				<input 
					type="checkbox" 
					name="has_custom_frontpage" 
					value="yes" 
					checked={isEnabled}
					onChange={handleStatusChange}
				/>
				<span className="switch-mask"></span>
				<span className="switch-labels">
					<span className="label-on">Yes</span>
					<span className="label-off">No</span>
				</span>
			</label>
          </p>

		  { isEnabled && (
          <div className="fpbuddy_fpstatus">
            <p className="alert alert-success">
              Your profile now has a custom front page!
              &nbsp;
              <a href="#">View</a>
            </p>
          </div>
		  )}
        </div>
      </div>
    </div>
  );
};

export default Enabler;
