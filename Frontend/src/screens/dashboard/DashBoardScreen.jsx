import axios from "axios";
import AnalyticsComponent from "./components/AnalyticsComponent";

function DashBoardScreen() {
  // const [data] = useOutletContext();
  // // console.log("data ", data)

  return (
    <div className=" h-full w-full px-10">
      <br />
      <AnalyticsComponent  />
    </div>
  );
}

export default DashBoardScreen;
