'use client';
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();
  const handleStartPlaying = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-md flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold mb-2">DupMe</h1>
        <p className="text-lg text-gray-700 text-center mb-4">
          Welcome to DupMe! Test your memory and musical skills in a fast-paced piano game. Compete with friends or practice solo. Can you keep up with the sequence?
        </p>
        <button
          onClick={handleStartPlaying}
          className="bg-black text-white px-8 py-4 rounded hover:bg-gray-800 transition-colors text-lg font-semibold cursor-pointer mt-4"
        >
          Start Playing
        </button>
      </div>
    </div>
  );
}
