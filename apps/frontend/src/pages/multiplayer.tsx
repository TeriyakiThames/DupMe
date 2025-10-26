'use client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BackButton } from "@/components/ui/backButton";
import { GameHeader } from "@/components/feature/gameHeader";
import { GameMode } from "@/components/feature/gameMode";

export default function Page() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleModeSelect = (level: string) => {
    if (!isAuthenticated) {
      alert('Please log in to play multiplayer.');
      return;
    }
    // Navigate to classic page with mode as query param (or handle as needed)
    navigate(`main/classic?mode=${level.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50 flex flex-col items-center p-8">
      {/* 🛑 BACK BUTTON CONTAINER FIX 🛑 */}
      <div className="w-full absolute top-8 left-0 px-8">
        <BackButton />
      </div>

      {/* Main Content Column: Centered on the screen. */}
      <div className="w-3/4 max-w-4xl flex flex-col items-center mt-12">
        <GameHeader title="Multiplayer" subtitle="" />
        {/* GameCard / Gray Container */}
        <div className="w-full bg-[#e6e6e6] p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-0 text-black">Classic</h2>
          {/* Input and interactive buttons are managed inside this Client Component */}
          <div className="md:space-y-6 mt-6">
            <GameMode
              level="Easy"
              emoji="😌"
              descriptionLines={['Hear the sound,', 'See the notes,', 'No need to remember']}
              color="green"
              onClick={() => handleModeSelect('Easy')}
            />
            <GameMode
              level="Medium"
              emoji="😏"
              descriptionLines={['Hear the sound,', 'See the notes,', 'Please do remember!']}
              color="yellow"
              onClick={() => handleModeSelect('Medium')}
            />
            <GameMode
              level="Hard"
              emoji="💀"
              descriptionLines={['Pitch Perfect!']}
              color="red"
              onClick={() => handleModeSelect('Hard')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}