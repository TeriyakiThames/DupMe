const LogoHeader = () => {
  return (
    <div
      className="inline-flex items-center space-x-3 p-4"
      aria-label="DupMe logo"
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
    </div>
  );
};

export default LogoHeader;