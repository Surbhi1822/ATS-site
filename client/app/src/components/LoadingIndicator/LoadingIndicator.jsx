import "./LoadingIndicator.css";

const LoadingIndicator = () => {
  return (
    <div className="pyramid-loader">
      <div className="wrapper">
        <span className="side side1"></span>
        <span className="side side2"></span>
        <span className="side side3"></span>
        <span className="side side4"></span>
        <span className="side side5"></span>
        <span className="side side6"></span>
        <span className="side side7"></span>
        <span className="side side8"></span>
        <span className="shadow"></span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
