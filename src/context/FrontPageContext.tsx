import React, { createContext, useContext } from 'react';

interface FrontPageContextType {
  object_type: string;
  object_id: number;
}

const FrontPageContext = createContext<FrontPageContextType | undefined>(undefined);

export const FrontPageProvider: React.FC<FrontPageContextType & { children: React.ReactNode }> = ({ 
  children, 
  object_type, 
  object_id 
}) => {
  return (
    <FrontPageContext.Provider value={{ object_type, object_id }}>
      {children}
    </FrontPageContext.Provider>
  );
};

export const useFrontPage = () => {
  const context = useContext(FrontPageContext);
  if (context === undefined) {
    throw new Error('useFrontPage must be used within a FrontPageProvider');
  }
  return context;
};