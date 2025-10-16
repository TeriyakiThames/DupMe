import GameModeCard from "./GameMode/GameModeCard";

const Practice =() => (
    <div className="flex flex-col items-center min-h-screen p-10">
        <div className="flex flex-col sm:flex-row gap-10">
            <GameModeCard
                title="Practice"
                description="sharpen your skills against out Bot"
                icon="🎯"
                href="/practice"
                bgColor="bg-white"
                textColor="text-black"
            />
        </div>
    </div>
)
export default Practice;
console.log(Practice);