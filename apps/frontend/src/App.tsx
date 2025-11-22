import { useState, useEffect } from "react";
import { apiBaseUrl } from "./config";
import { trpc } from "./trpc";
import z from "zod";

const schema = z.object({ message: z.string() });

function App() {
  const [message, setMessage] = useState<string>("");
  const [trpcMessage, setTrpcMessage] = useState<string>("");

  useEffect(() => {
    const getMessages = async () => {
      const res = await fetch(`${apiBaseUrl}/`);
      const data = schema.parse(await res.json());
      setMessage(data.message);

      const trpcData = await trpc.helloWorld.query();
      setTrpcMessage(trpcData.message);
    };

    getMessages();
  }, []);

  return (
    <>
      <p>{message}</p>
      <p>{trpcMessage}</p>
    </>
  );
}

export default App;
