import React from "react";

const LogoHeader = () => {
  return (
    <a
      href="/"
      className="inline-flex items-center space-x-3 p-4 cursor-pointer transition duration-300 ease-in-out hover:opacity-80"
      aria-label="Go to homepage"
    >
      {/* Piano Icon */}
      <span className="text-5xl" role="img" aria-label="Piano keyboard icon">
        🎹
      </span>

      {/* App Name: DupMe */}
      <span
        className="text-5xl font-extrabold italic text-black tracking-tight"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        DupMe
      </span>
    </a>
  );
};

export default LogoHeader;
