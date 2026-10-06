



import React, { createContext, useContext } from "react";

const ProjectContext = createContext();

export const useProjects = () => {
  return useContext(ProjectContext);
};

export const ProjectProvider = ({ children }) => {
  //  Project state removed intentionally
  return (
    <ProjectContext.Provider value={{}}>
      {children}
    </ProjectContext.Provider>
  );
};
