import React, { useState, useEffect } from "react";
import { FrontPageProvider } from './context/FrontPageContext';
import Enabler from "./components/Enabler";
import Layout from "./components/Layout";

function App() {
  const _globals: object = window.FRONTPAGE_BUDDY;

  return (
	<FrontPageProvider 
      object_type={_globals.object_type} 
      object_id={_globals.object_id} 
    >
		<div className="fpbuddy_manage_widgets fpbuddy_wrapper">
		{_globals.show_enable_disable_ui && (
			<Enabler />
		)}

			<div className="fpbuddy_container">
				<div className="fpbuddy_content">
					<p>Customize your front page by adding text, videos, embedding your social media feed, etc.</p>
					
					<div className="fpbuddy_added_widgets fpbuddy_wrapper">
						<div className="fpbuddy_container">
							<div className="fpbuddy_content">
								<Layout />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</FrontPageProvider>
	);
}
	
export default App;
