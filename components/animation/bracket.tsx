const BracketAnimation = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <span
        className="animate-bracket bg-bracket-gradient bg-clip-text"
        style={{ WebkitTextFillColor: "transparent", backgroundSize: "auto 200%" }}
      >
        [
      </span>
      {children}
      <span
        className="animate-bracket bg-bracket-gradient bg-clip-text"
        style={{ WebkitTextFillColor: "transparent", backgroundSize: "auto 200%" }}
      >
        ]
      </span>
    </>
  )
}

export default BracketAnimation
