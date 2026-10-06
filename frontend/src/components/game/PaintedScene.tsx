import { useId } from "react";
export function PaintedScene({
  scene,
  weather = "clear",
  shelter = 0,
  parts = 0,
}: {
  scene: string;
  weather?: string;
  shelter?: number;
  parts?: number;
}) {
  const id = useId().replaceAll(":", "");
  const cave = scene === "cave";
  const water = scene === "water";
  const jungle = scene === "jungle";
  const shore = scene === "shore";
  const boat = scene === "boat";
  const rainy = weather === "rainy" || weather === "stormy";
  return (
    <svg
      className={`painted-scene ${rainy ? "wet-scene" : ""}`}
      viewBox="0 0 640 660"
      role="img"
      aria-label={`Painted ${scene} illustration, ${weather} weather`}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor={cave ? "#718783" : rainy ? "#80969c" : "#a8c8bd"} />
          <stop offset="1" stopColor="#f0d5a1" />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x2="0" y2="1">
          <stop stopColor="#679a9a" />
          <stop offset="1" stopColor="#abc3ac" />
        </linearGradient>
        <linearGradient id={`${id}-rock`} x2="1" y2="1">
          <stop stopColor="#92957c" />
          <stop offset="1" stopColor="#515f53" />
        </linearGradient>
      </defs>
      <rect width="640" height="660" fill={`url(#${id}-sky)`} />
      <circle
        cx="470"
        cy="134"
        r="56"
        fill="#f8e4b8"
        opacity={rainy ? 0.25 : 0.9}
      />
      <g className="scene-cloud">
        <path
          d="M50 150Q80 123 116 145Q153 105 189 142Q231 133 248 154Z"
          fill="#f1e5c7"
          opacity=".6"
        />
        <path
          d="M341 92Q366 71 394 87Q422 60 450 89L493 96Z"
          fill="#f1e5c7"
          opacity=".5"
        />
      </g>
      <path
        d="M0 270Q93 226 192 252Q295 194 405 242Q508 210 640 253V430H0Z"
        fill="#6d9180"
      />
      <path
        d="M0 289Q116 269 222 294Q400 260 640 289V509H0Z"
        fill={`url(#${id}-sea)`}
      />
      <g
        className="scene-ripples"
        fill="none"
        stroke="#e3ead0"
        strokeWidth="3"
        opacity=".5"
      >
        <path d="M268 326h77m48 33h89m-125 45h96m30-73h64" />
        <path d="M86 364h80m-24 31h53" />
      </g>
      <path d="M0 454Q110 398 257 447Q398 410 640 479V660H0Z" fill="#d6bf8c" />
      <path d="M0 492Q163 436 281 495Q440 466 640 514V660H0Z" fill="#e4cc98" />
      <path d="M0 592Q186 503 364 568Q506 539 640 585V660H0Z" fill="#c5ae7a" />
      {(jungle || water || cave) && (
        <>
          <path
            d="M0 0H181L143 110L183 201L111 273L134 378L0 463Z"
            fill="#355a4e"
          />
          <path
            d="M640 0H530L502 93L559 168L498 237L559 350L640 410Z"
            fill="#416453"
          />
          <path
            d="M0 113L119 37L153 137L61 198L102 286L0 332Z"
            fill="#5e7d58"
          />
          <path d="M640 84L566 117L533 213L600 270L640 233Z" fill="#779064" />
        </>
      )}
      {cave ? (
        <>
          <path
            d="M98 471L136 259L240 180L411 163L520 257L568 478L480 523L167 517Z"
            fill={`url(#${id}-rock)`}
          />
          <path
            d="M185 489L206 345L277 273L392 283L461 382L472 503Z"
            fill="#243e3c"
          />
          <path
            d="M222 485L244 372L296 320L364 325L417 401L423 498Z"
            fill="#1a3032"
          />
          <path d="M275 273l26 69 19-60m45 7 26 60 10-41" fill="#7a806d" />
          <path
            d="M194 498L240 470L274 499L371 474L443 504L472 492L514 541H158Z"
            fill="#a89771"
          />
          <g fill="#d8c79d">
            <path d="M269 465l8-22 14 30Z" />
            <path d="M391 479l12-27 8 29Z" />
          </g>
        </>
      ) : water ? (
        <>
          <path
            d="M285 300Q237 351 327 394Q404 436 249 478Q188 510 304 559L491 660H315Q165 566 191 521Q204 473 330 445Q391 420 288 384Q238 359 272 299Z"
            fill="#5b9f9e"
          />
          <path
            d="M281 318Q259 355 310 384M332 419q41 21-30 37M248 497q-32 34 43 50"
            fill="none"
            stroke="#c8dcca"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M198 473l-48-39-46 54 60 22Zm208-56 36-52 59 48-27 31Z"
            fill="#809480"
          />
        </>
      ) : jungle ? (
        <>
          <path
            d="M240 660Q231 556 344 451Q322 389 332 314L370 309Q358 384 392 455Q296 563 355 660Z"
            fill="#a8a273"
          />
          <g fill="#6e8459">
            <ellipse cx="129" cy="497" rx="115" ry="66" />
            <ellipse cx="520" cy="484" rx="124" ry="72" />
          </g>
          <g fill="#90a16b">
            <ellipse cx="61" cy="480" rx="76" ry="36" />
            <ellipse cx="586" cy="451" rx="69" ry="42" />
          </g>
          <path
            d="M117 435L96 241M533 413l25-213"
            stroke="#5f6550"
            strokeWidth="22"
          />
          <path
            d="M92 275l-67-34m74 74 79-75m376 9-67-40"
            stroke="#5f6550"
            strokeWidth="13"
            strokeLinecap="round"
          />
        </>
      ) : shore ? (
        <>
          <path d="M310 415l71-71 158 53-51 91-133 14Z" fill="#776849" />
          <path
            d="M338 416l152 38m-114-80-25 98m71-90-28 82m74-65-29 70"
            stroke="#a39267"
            strokeWidth="8"
          />
          <path d="M408 348l15-119" stroke="#776849" strokeWidth="10" />
          <path d="M424 244l69 92-68-15Z" fill="#d7c9a4" />
          <path
            d="M92 525q92-59 200 6"
            stroke="#a99b73"
            strokeWidth="16"
            fill="none"
          />
          <g fill="#f3e2b7">
            <ellipse cx="148" cy="580" rx="9" ry="5" />
            <ellipse cx="489" cy="556" rx="12" ry="6" />
          </g>
        </>
      ) : boat ? (
        <>
          <path
            d="M177 504Q319 553 481 482L449 543Q310 586 204 549Z"
            fill={parts ? "#89724f" : "#b19b6a"}
            stroke="#5e634b"
            strokeWidth="7"
          />
          <path d="M218 521l232-3" stroke="#d0b47b" strokeWidth="10" />
          {parts > 1 && (
            <>
              <path d="M335 518V294" stroke="#776b4c" strokeWidth="10" />
              <path
                d="M347 310L449 462L347 446Z"
                fill="#f2dfac"
                stroke="#b9a16d"
                strokeWidth="3"
              />
            </>
          )}
          <path
            d="M139 575l93 34m222-42 65 29"
            stroke="#b09b6c"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {shelter > 0 ? (
            <>
              <path
                d="M161 516L283 369L399 514Z"
                fill="#858f63"
                stroke="#526449"
                strokeWidth="6"
              />
              <path d="M279 387L299 514H205Z" fill="#465b46" />
              <path d="M287 383L371 509H298Z" fill="#b5b382" />
              <path d="M160 531h245" stroke="#a38b5a" strokeWidth="9" />
            </>
          ) : (
            <>
              <path
                d="M168 514l126-24 93 36-136 25Z"
                fill="#9b9c6b"
                stroke="#63755a"
                strokeWidth="5"
              />
              <ellipse cx="196" cy="513" rx="26" ry="13" fill="#b9b782" />
              <path d="M296 490l55 43" stroke="#d1c192" strokeWidth="3" />
            </>
          )}
          <ellipse cx="457" cy="561" rx="39" ry="13" fill="#aa9468" />
          <path
            d="M430 560l48-13m-47-3 47 18"
            stroke="#776649"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            className="scene-fire"
            d="M447 552Q430 526 453 501Q449 523 466 525Q481 546 460 555Z"
            fill="#e4a25d"
          />
          <path d="M38 626l74-68 70 41-20 61H38Z" fill="#91a16b" />
        </>
      )}
      <g fill="#466950">
        <path d="M0 660V498Q50 469 100 495L46 532L100 548L38 565L78 598L32 612L67 660Z" />
        <path d="M640 660V477L590 505L554 504L585 548L545 568L598 595L566 628L602 660Z" />
      </g>
      <g fill="#b9bb7b" opacity=".7">
        <path d="M12 579l23-37 13 52Zm590-48-10-42 23 31Z" />
        <path d="M526 616l18-30 10 35Z" />
      </g>
      {rainy && (
        <g
          className="scene-rain"
          stroke="#d6e4d6"
          strokeWidth="2"
          opacity=".45"
        >
          {Array.from({ length: 18 }, (_, i) => (
            <path key={i} d={`M${30 + i * 37} ${40 + (i % 5) * 107}l-16 47`} />
          ))}
        </g>
      )}
    </svg>
  );
}
