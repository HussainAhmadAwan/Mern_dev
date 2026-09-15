import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import API from "../api/api";

const DEFAULT_ANNOUNCEMENT_SPEED = 20;
const MIN_ANNOUNCEMENT_SPEED = 0;
const MAX_ANNOUNCEMENT_SPEED = 120;

const AnnouncementBar = () => {
  const [announcementText, setAnnouncementText] =
    useState("");

  const [announcementSpeed, setAnnouncementSpeed] =
    useState(DEFAULT_ANNOUNCEMENT_SPEED);

  const [loading, setLoading] =
    useState(true);

  // Load the announcement text and saved speed from MongoDB.
  useEffect(() => {
    const fetchAnnouncementSettings = async () => {
      try {
        setLoading(true);

        const response = await API.get("/settings");

        if (response.data?.success) {
          const settings =
            response.data.settings || {};

          setAnnouncementText(
            settings.announcementText || ""
          );

          const savedSpeed = Number(
            settings.announcementSpeed ??
              DEFAULT_ANNOUNCEMENT_SPEED
          );

          if (
            Number.isFinite(savedSpeed) &&
            savedSpeed >= MIN_ANNOUNCEMENT_SPEED &&
            savedSpeed <= MAX_ANNOUNCEMENT_SPEED
          ) {
            setAnnouncementSpeed(savedSpeed);
          } else {
            setAnnouncementSpeed(
              DEFAULT_ANNOUNCEMENT_SPEED
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load announcement settings:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncementSettings();
  }, []);

  // Convert every new line in the admin text into a separate announcement sentence.
  const announcementSentences = useMemo(() => {
    return announcementText
      .split(/\r?\n/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }, [announcementText]);

  // Do not render anything while loading or when there is no announcement.
  if (
    loading ||
    announcementSentences.length === 0
  ) {
    return null;
  }

  const tickerDuration =
    Number(announcementSpeed);

  const isTickerMoving =
    Number.isFinite(tickerDuration) &&
    tickerDuration > 0;

  return (
    <>
      {/* =========================
          SINGLE ANNOUNCEMENT TICKER
      ========================== */}

      <div
        className={`relative z-40 w-full overflow-hidden border-b ${
          isTickerMoving
            ? "border-orange-200 bg-orange-50 shadow-sm dark:border-orange-900/40 dark:bg-orange-950/30"
            : "border-gray-200 bg-white dark:border-gray-300 dark:bg-white"
        }`}
        aria-label="Website announcements"
      >
        {/* Keep the announcement icon fixed while the text moves. */}
        <div
          className={`absolute left-0 top-0 z-10 flex h-full items-center px-3 text-xs font-bold sm:px-4 sm:text-sm ${
            isTickerMoving
              ? "bg-orange-50 text-orange-600 shadow-[6px_0_12px_-8px_rgba(0,0,0,0.35)] dark:bg-orange-950/30 dark:text-orange-400"
              : "bg-white text-orange-500 dark:bg-white"
          }`}
        >
          📢
        </div>

        {/* Keep the ticker shorter and prevent content from overflowing. */}
        <div
          className={`overflow-hidden pl-10 pr-2 sm:pl-12 ${
            isTickerMoving
              ? "py-1.5"
              : "py-1"
          }`}
        >
          {/* Pause the moving ticker when the user hovers over it. */}
          <div
            className="flex w-max"
            style={
              isTickerMoving
                ? {
                    animationName:
                      "announcementTicker",
                    animationDuration: `${tickerDuration}s`,
                    animationTimingFunction:
                      "linear",
                    animationIterationCount:
                      "infinite",
                    animationPlayState:
                      "running",
                    willChange:
                      "transform",
                  }
                : {
                    animation: "none",
                  }
            }
            onMouseEnter={(event) => {
              if (isTickerMoving) {
                event.currentTarget.style.animationPlayState =
                  "paused";
              }
            }}
            onMouseLeave={(event) => {
              if (isTickerMoving) {
                event.currentTarget.style.animationPlayState =
                  "running";
              }
            }}
          >
            {/* Render only one group when stopped at speed 0. */}
            <div className="flex shrink-0 items-center">
              {announcementSentences.map(
                (sentence, index) => (
                  <span
                    key={`ticker-1-${index}`}
                    className={`inline-flex shrink-0 items-center px-4 text-sm font-medium sm:px-6 ${
                      isTickerMoving
                        ? "text-gray-700 dark:text-gray-200"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="mr-3 font-bold text-orange-500">
                      •
                    </span>

                    {sentence}
                  </span>
                )
              )}
            </div>

            {/* Duplicate groups are only needed while the ticker is moving. */}
            {isTickerMoving && (
              <>
                {/* Second announcement group keeps movement continuous. */}
                <div className="flex shrink-0 items-center">
                  {announcementSentences.map(
                    (sentence, index) => (
                      <span
                        key={`ticker-2-${index}`}
                        className="inline-flex shrink-0 items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 sm:px-6"
                      >
                        <span className="mr-3 font-bold text-orange-500">
                          •
                        </span>

                        {sentence}
                      </span>
                    )
                  )}
                </div>

                {/* Third announcement group prevents empty space on wide screens. */}
                <div className="flex shrink-0 items-center">
                  {announcementSentences.map(
                    (sentence, index) => (
                      <span
                        key={`ticker-3-${index}`}
                        className="inline-flex shrink-0 items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 sm:px-6"
                      >
                        <span className="mr-3 font-bold text-orange-500">
                          •
                        </span>

                        {sentence}
                      </span>
                    )
                  )}
                </div>

                {/* Fourth announcement group keeps the ticker filled on very wide screens. */}
                <div className="flex shrink-0 items-center">
                  {announcementSentences.map(
                    (sentence, index) => (
                      <span
                        key={`ticker-4-${index}`}
                        className="inline-flex shrink-0 items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 sm:px-6"
                      >
                        <span className="mr-3 font-bold text-orange-500">
                          •
                        </span>

                        {sentence}
                      </span>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Move exactly one announcement group during each animation cycle. */}
      <style>
        {`
          @keyframes announcementTicker {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-25%);
            }
          }
        `}
      </style>
    </>
  );
};

export default AnnouncementBar;