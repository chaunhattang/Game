import { useId } from 'react';

const palettes = {
  gravity: ['#19172f', '#402561', '#c084fc'],
  tictactoe: ['#241b43', '#59447a', '#c8b3f7'],
  connectfive: ['#263f43', '#4d7360', '#efd5a1'],
  pong: ['#122c3c', '#245d66', '#6be5de'],
  tank: ['#a18f64', '#e0c79a', '#ddf7a2'],
  bomber: ['#34524a', '#759974', '#ffc879'],
  racing: ['#284955', '#7fa88c', '#ffab99'],
};
function Pilot({ x, y, color, flip = false }) {
  return (
    <g transform={`translate(${x} ${y}) ${flip ? 'rotate(180)' : ''}`}>
      <ellipse cx="2" cy="40" rx="37" ry="10" fill="#090e1c" opacity=".18" />
      <rect x="-37" y="2" width="16" height="33" rx="6" fill="#4e5274" />
      <rect x="-23" y="-2" width="46" height="46" rx="14" fill={color} />
      <path
        d="M-17 41v10m32-10v10M-24 12l-12 14m60-14l12 14"
        stroke="#f3edff"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cy="-15" r="34" fill="#f5edff" />
      <circle cy="-15" r="29" fill={color} />
      <rect x="-25" y="-32" width="50" height="29" rx="12" fill="#25304f" />
      <path d="M-16-25h16" stroke="#c9f7ff" strokeWidth="4" strokeLinecap="round" />
      <rect x="-8" y="12" width="16" height="10" rx="3" fill="#fff4d8" />
    </g>
  );
}
export default function Artwork({ id, hero = false }) {
  const uid = useId().replaceAll(':', ''),
    [bg, mid, c] = palettes[id] || palettes.gravity;
  return (
    <svg
      className={`artwork ${hero ? 'hero-art' : ''}`}
      viewBox="0 0 480 280"
      role="img"
      aria-label={`${id} original game illustration`}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x2="1" y2="1">
          <stop stopColor={bg} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
        <radialGradient id={`${uid}-shine`}>
          <stop stopColor={c} stopOpacity=".28" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="280" fill={`url(#${uid}-bg)`} />
      <rect width="480" height="280" fill={`url(#${uid}-shine)`} />
      {Array.from({ length: 18 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 127 + 13) % 480}
          cy={(i * 73 + 11) % 280}
          r={i % 4 ? 1 : 2}
          fill="#ffffff"
          opacity=".18"
        />
      ))}
      {id === 'gravity' && (
        <g>
          <circle cx="367" cy="90" r="57" fill="#b587e9" opacity=".19" />
          <ellipse
            cx="367"
            cy="90"
            rx="85"
            ry="15"
            fill="none"
            stroke="#d4b6f8"
            strokeWidth="5"
            opacity=".28"
            transform="rotate(-20 367 90)"
          />
          <path
            d="M30 61h290M170 232h280"
            stroke="#a7a6d7"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".45"
          />
          <g transform="translate(280 200) rotate(-12)">
            <rect x="0" y="-49" width="30" height="69" rx="6" fill="#faac74" />
            <path d="M6-38l18 8M6-18l18 8M6 2l18 8" stroke="#81495b" strokeWidth="6" />
          </g>
          <Pilot x={155} y={154} color="#ba99fa" />
          <Pilot x={332} y={164} color="#70e1dc" flip />
          <path
            d="M91 113v63m-10-48l10-15 10 15M405 186v-63m-10 48l10 15 10-15"
            stroke="#e6dbff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity=".6"
          />
          <path
            d="M112 218h33m-20 10h32"
            stroke="#c4a5fb"
            strokeWidth="3"
            opacity=".5"
            strokeLinecap="round"
          />
        </g>
      )}
      {id === 'tictactoe' && (
        <g transform="translate(240 141) rotate(-9)">
          <rect x="-119" y="-111" width="242" height="232" rx="23" fill="#120f29" opacity=".3" />
          <rect x="-122" y="-119" width="242" height="232" rx="23" fill="#e3d4f0" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              x={-110 + (i % 3) * 76}
              y={-107 + Math.floor(i / 3) * 73}
              width="66"
              height="63"
              rx="12"
              fill={i % 2 ? '#bda4d4' : '#cdb8e1'}
              stroke="#f8f1ff"
              strokeOpacity=".4"
            />
          ))}
          <g stroke="#7044a1" strokeWidth="10" strokeLinecap="round">
            <path d="M-95-90l34 32m0-32l-34 32M-19-17l34 32m0-32l-34 32M57 56l34 32m0-32L57 88" />
          </g>
          <g stroke="#148995" strokeWidth="9" fill="none">
            <circle cx="73" cy="-74" r="21" />
            <circle cx="-78" cy="73" r="21" />
          </g>
          <path
            d="M-104-103L105 98"
            stroke="#9963d5"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".5"
          />
        </g>
      )}
      {id === 'connectfive' && (
        <g transform="translate(113 34) rotate(8 126 103)">
          <rect x="4" y="9" width="256" height="213" rx="15" fill="#172e2c" opacity=".4" />
          <rect width="256" height="213" rx="15" fill="#dcb77c" stroke="#f6dca8" strokeWidth="4" />
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} stroke="#946b40" strokeOpacity=".6">
              <path d={`M18 ${19 + i * 22}H237M${19 + i * 27} 19V195`} />
            </g>
          ))}
          {[
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
            [6, 7],
          ].map(([x, y]) => (
            <g key={x}>
              <ellipse
                cx={21 + x * 27}
                cy={23 + y * 22}
                rx="11"
                ry="8"
                fill="#644e33"
                opacity=".3"
              />
              <circle cx={19 + x * 27} cy={19 + y * 22} r="10" fill="#273747" />
              <circle cx={16 + x * 27} cy={16 + y * 22} r="3" fill="#6f8691" />
            </g>
          ))}
          {[
            [1, 5],
            [2, 5],
            [3, 5],
            [4, 3],
            [5, 3],
          ].map(([x, y]) => (
            <circle
              key={x}
              cx={19 + x * 27}
              cy={19 + y * 22}
              r="10"
              fill="#fff3d8"
              stroke="#bca47e"
            />
          ))}
        </g>
      )}
      {id === 'pong' && (
        <g transform="translate(240 140) rotate(-9)">
          <rect
            x="-174"
            y="-103"
            width="348"
            height="213"
            rx="25"
            fill="#081b2b"
            stroke="#6cabae"
            strokeWidth="4"
          />
          <rect
            x="-153"
            y="-83"
            width="306"
            height="173"
            rx="15"
            fill="none"
            stroke="#2e626e"
            strokeWidth="2"
          />
          <path d="M0-82V90" stroke="#548b90" strokeDasharray="7 8" />
          <circle r="47" fill="none" stroke="#4e7d86" strokeWidth="2" />
          <rect x="-140" y="-51" width="14" height="70" rx="6" fill="#c5a9ff" />
          <rect x="126" y="-3" width="14" height="70" rx="6" fill="#72e6dd" />
          <path d="M20 42l66-75" stroke="#73e8dd" strokeWidth="19" opacity=".13" />
          <circle cx="91" cy="-38" r="14" fill="#74e7dc" opacity=".2" />
          <circle cx="91" cy="-38" r="8" fill="#f3fff7" />
          <text x="-47" y="-55" fill="#dce6e9" fontSize="24" fontFamily="monospace">
            3 : 2
          </text>
        </g>
      )}
      {id === 'tank' && (
        <g>
          <path d="M0 208q140-40 260 10t220-8v70H0" fill="#a18c61" opacity=".3" />
          {[
            [205, 56, 42, 80],
            [252, 172, 66, 39],
            [89, 201, 54, 24],
          ].map(([x, y, w, h]) => (
            <g key={x}>
              <rect x={x + 5} y={y + 6} width={w} height={h} rx="5" fill="#695c44" opacity=".3" />
              <rect x={x} y={y} width={w} height={h} rx="5" fill="#7c8b7c" />
              <path d={`M${x + 4} ${y + 6}h${w - 8}`} stroke="#b0bba0" strokeWidth="5" />
            </g>
          ))}
          {[
            [120, 125, 28, '#d8eea1'],
            [355, 139, 163, '#75d9da'],
          ].map(([x, y, r, f]) => (
            <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
              <ellipse cy="7" rx="44" ry="30" fill="#5f513c" opacity=".25" />
              <rect x="-33" y="-28" width="66" height="16" rx="5" fill="#34424b" />
              <rect x="-33" y="12" width="66" height="16" rx="5" fill="#34424b" />
              {[-25, -13, -1, 11, 23].map((v) => (
                <path key={v} d={`M${v}-25v10m0 20v10`} stroke="#75817b" strokeWidth="3" />
              ))}
              <rect x="-28" y="-20" width="56" height="40" rx="10" fill={f} />
              <path d="M-21-15h39" stroke="#f4f5d5" strokeWidth="5" strokeLinecap="round" />
              <circle r="16" fill="#596e64" />
              <path d="M5 0h45" stroke="#34424b" strokeWidth="11" />
              <path d="M8-2h41" stroke={f} strokeWidth="5" />
            </g>
          ))}
          <circle cx="225" cy="148" r="5" fill="#fff0ae" />
        </g>
      )}
      {id === 'bomber' && (
        <g transform="translate(85 34) rotate(-7 150 100)">
          <rect width="310" height="217" rx="17" fill="#8aaf83" stroke="#bbcf9c" strokeWidth="3" />
          {[
            [20, 22],
            [84, 22],
            [212, 22],
            [148, 87],
            [20, 152],
            [212, 152],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y + 4} width="48" height="47" rx="7" fill="#725e41" opacity=".35" />
              <rect
                x={x}
                y={y}
                width="48"
                height="46"
                rx="5"
                fill="#d5a56d"
                stroke="#f4d19a"
                strokeWidth="2"
              />
              <path d={`M${x + 7} ${y + 7}l34 32m0-32l-34 32`} stroke="#9c6e42" strokeWidth="4" />
            </g>
          ))}
          <circle cx="155" cy="131" r="30" fill="#293847" />
          <circle cx="146" cy="121" r="7" fill="#7e8b93" />
          <path d="M164 103q11-32 30-22" stroke="#d8aa67" strokeWidth="5" fill="none" />
          <path d="M193 70v22m-11-11h22" stroke="#ffebaf" strokeWidth="4" />
          <rect x="78" y="98" width="36" height="39" rx="12" fill="#bda3f5" />
          <rect x="82" y="107" width="28" height="17" rx="6" fill="#fff0d2" />
          <path d="M91 114v4m10-4v4" stroke="#293847" strokeWidth="4" />
        </g>
      )}
      {id === 'racing' && (
        <g transform="translate(240 140) rotate(-9)">
          <rect
            x="-184"
            y="-105"
            width="368"
            height="215"
            rx="25"
            fill="#354554"
            stroke="#f1d7bb"
            strokeWidth="5"
          />
          <rect x="-111" y="-40" width="222" height="87" rx="15" fill="#8cbb97" />
          <rect
            x="-148"
            y="-72"
            width="296"
            height="150"
            rx="17"
            fill="none"
            stroke="#e1ddd0"
            strokeWidth="2"
            strokeDasharray="12 10"
            opacity=".5"
          />
          <ellipse cy="4" rx="52" ry="25" fill="#86cfd0" />
          <circle cx="-80" cy="4" r="20" fill="#578c6a" />
          <circle cx="83" cy="4" r="21" fill="#6da578" />
          <path d="M0-104v63" stroke="white" strokeWidth="13" strokeDasharray="8 8" />
          {[
            [65, -74, '#ffa09d'],
            [-55, 78, '#6ce2df'],
          ].map(([x, y, f]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <path d="M-14-15v30m28-30v30" stroke="#233240" strokeWidth="7" />
              <rect x="-24" y="-12" width="48" height="24" rx="7" fill={f} />
              <rect x="-6" y="-10" width="18" height="20" rx="4" fill="#2b4059" />
              <path d="M-24-14v28" stroke="#253544" strokeWidth="4" />
              <path d="M18-8v5m0 6v5" stroke="#fff3c4" strokeWidth="3" />
            </g>
          ))}
        </g>
      )}
      <path d="M438 29v12m-6-6h12" stroke={c} strokeWidth="2" opacity=".5" />
    </svg>
  );
}
