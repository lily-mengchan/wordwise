import { useUrlPosition } from "../hooks/useUrlPosition";
import { useReverseGeocoding } from "../hooks/useReverseGeocoding";
import Message from "./Message";
import Spinner from "./Spinner";
import BackButton from "./BackButton";
import CityAIPanel from "./CityAIPanel";
import styles from "./City.module.css";

function ExploreCity() {
  const [lat, lng] = useUrlPosition();
  const {
    cityData,
    isLoading: isLoadingGeocoding,
    error: geocodingError,
  } = useReverseGeocoding(lat, lng);

  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;

  if (isLoadingGeocoding) return <Spinner />;

  if (geocodingError) return <Message message={geocodingError} />;

  if (!cityData) return null;

  return (
    <div className={styles.city}>
      <CityAIPanel city={cityData} />

      <div>
        <BackButton />
      </div>
    </div>
  );
}

export default ExploreCity;
