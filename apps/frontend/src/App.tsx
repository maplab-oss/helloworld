import { useState, useEffect } from "react";
import { apiBaseUrl } from "./config";
import z from "zod";

const schema = z.object({ message: z.string() });

function App() {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const getMessage = async () => {
      const res = await fetch(`${apiBaseUrl}/`);
      const data = schema.parse(await res.json());
      setMessage(data.message);
    };

    getMessage();
  }, []);

  return <p>{message}</p>;
}

export default App;
