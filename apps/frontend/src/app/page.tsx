'use client';
import Image from "next/image";
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div>
        {/* 🟢 Join Game Button */}
      <Button 
        variant="join" 
        //className="h-12 font-bold"
        //onClick={() => console.log("Joining game...")}
      >
        Join Game
      </Button>

      {/* ⚫ Create a room Button */}
      <Button 
        variant="create" 
        //className="h-12 font-bold"
        onClick={() => console.log("Creating room...")}
      >
        Create a room
      </Button>

      {/* 🔴 Cancel Button */}
      <Button 
        variant="cancel" 
        //className="h-12 font-bold"
        //onClick={() => console.log("Canceled action...")}
      >
        Cancel
      </Button>
    </div>
  );
}
