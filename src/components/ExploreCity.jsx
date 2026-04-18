import { useUrlPosition } from "../hooks/useUrlPosition";
import { useReverseGeocoding } from "../hooks/useReverseGeocoding";
import { useCities } from "../contexts/CitiesContext";
import Message from "./Message";
import Spinner from "./Spinner";
import BackButton from "./BackButton";
import CityAIPanel from "./CityAIPanel";
import styles from "./City.module.css";

function ExploreCity() {
  const [lat, lng] = useUrlPosition();
  const { cities } = useCities();
  const {
    cityData,
    isLoading: isLoadingGeocoding,
    error: geocodingError,
  } = useReverseGeocoding(lat, lng);

  const existingCity = cityData
    ? cities.find(
        (city) =>
          city.cityName?.toLowerCase() === cityData.cityName.toLowerCase() &&
          city.country?.toLowerCase() === cityData.country.toLowerCase(),
      )
    : null;

  if (!lat && !lng)
    return <Message message="Start by clicking somewhere on the map" />;

  if (isLoadingGeocoding) return <Spinner />;

  if (geocodingError) return <Message message={geocodingError} />;

  if (!cityData) return null;

  return (
    <div className={styles.city}>
      <div className={styles.row}>
        <h6>City name</h6>
        <h3>
          <span>{cityData.emoji}</span> {cityData.cityName}
        </h3>
      </div>

      <div className={styles.row}>
        <h6>Country</h6>
        <p>{cityData.country}</p>
      </div>

      <div className={styles.row}>
        <h6>Status</h6>
        <p>
          {existingCity
            ? "Already in your visited list. Use AI to plan a deeper second trip."
            : "Not visited yet. This route is ready for AI-assisted exploration."}
        </p>
      </div>

      <div className={styles.row}>
        <h6>Auto-filled from map click</h6>
        <p>
          {cityData.cityName}, {cityData.country} {cityData.emoji}
        </p>
      </div>

      <div className={styles.row}>
        <h6>Coordinates</h6>
        <p>
          {Number(lat).toFixed(3)}, {Number(lng).toFixed(3)}
        </p>
      </div>

      <CityAIPanel city={cityData} />

      <div>
        <BackButton />
      </div>
    </div>
  );
}

export default ExploreCity;
