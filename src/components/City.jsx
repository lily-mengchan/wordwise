import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useCities } from "../contexts/CitiesContext";
import styles from "./City.module.css";
import Spinner from "./Spinner";
import BackButton from "./BackButton";
import Button from "./Button";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date(date));

function City() {
  const { id } = useParams();
  const { getCity, currentCity, isLoading, updateCity } = useCities();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDate, setEditedDate] = useState("");
  const [editedNotes, setEditedNotes] = useState("");

  useEffect(
    function () {
      getCity(id);
    },
    [id, getCity],
  );

  useEffect(
    function () {
      if (!currentCity?.id) return;

      setEditedDate(currentCity.date?.slice(0, 10) || "");
      setEditedNotes(currentCity.notes || "");
    },
    [currentCity],
  );

  const { cityName, emoji, date, notes } = currentCity;

  async function handleSaveChanges() {
    if (!currentCity?.id || !editedDate) return;

    await updateCity({
      ...currentCity,
      date: new Date(editedDate).toISOString(),
      notes: editedNotes,
    });

    setIsEditing(false);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className={styles.city}>
      <div className={styles.row}>
        <h6>City name</h6>
        <h3>
          <span>{emoji}</span> {cityName}
        </h3>
      </div>

      <div className={styles.row}>
        <h6>You went to {cityName} on</h6>
        <p>{formatDate(date || null)}</p>
      </div>

      {notes && (
        <div className={styles.row}>
          <h6>Your notes</h6>
          <p>{notes}</p>
        </div>
      )}

      <div className={styles.row}>
        <h6>Manage this city</h6>
        {isEditing ? (
          <div style={{ width: "100%" }}>
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              style={{
                width: "100%",
                marginBottom: "1rem",
                padding: "0.8rem 1rem",
                borderRadius: "8px",
                border: "1px solid #666",
                backgroundColor: "#2d3439",
                color: "#fff",
              }}
            />
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              rows="4"
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                borderRadius: "8px",
                border: "1px solid #666",
                backgroundColor: "#2d3439",
                color: "#fff",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "0.8rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              <Button type="primary" onClick={handleSaveChanges}>
                Save changes
              </Button>
              <Button type="back" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="primary" onClick={() => setIsEditing(true)}>
            Edit trip notes
          </Button>
        )}
      </div>

      <div className={styles.row}>
        <h6>Learn more</h6>
        <a
          href={`https://en.wikipedia.org/wiki/${cityName}`}
          target="_blank"
          rel="noreferrer"
        >
          Check out {cityName} on Wikipedia &rarr;
        </a>
      </div>

      <div>
        <BackButton />
      </div>
    </div>
  );
}

export default City;
