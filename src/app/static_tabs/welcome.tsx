import React, { useState, useEffect } from "react";
import {
  Spinner, // Import Spinner
  Text
} from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";

export function WelcomeTab({ }: { }) {
  const [isLoading, setIsLoading] = useState(true); // Add loading state, default true

  // Simulate loading or some async operation
  useEffect(() => {
    const timer = setTimeout(() => {
      // After loading, you might want to navigate or change the view
      // For now, let's just set loading to false as an example
      setIsLoading(false);
      // Example: navigate('/some-other-route');
    }, 3000); // Simulate 3 seconds loading time

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div style={{
      padding: "1.6rem",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh" // Ensure it takes up significant screen height
    }}>
      {isLoading ? (
        <>
          <Text size={600} weight="semibold" style={{ marginBottom: "1rem" }}>Aguarde</Text>
          <Spinner size="huge" labelPosition="below" label="Carregando suas informações..." />
        </>
      ) : (
        // Content to show after loading finishes (optional)
        <Text size={500}>Carregamento concluído!</Text>
        // Or you could navigate away in the useEffect
      )}
    </div>
  );
}