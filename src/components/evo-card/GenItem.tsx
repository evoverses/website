import { IGenItem } from "./types";

export const GenItem = ({ multiplier = 1, genName, genValue, style }: IGenItem) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: `${32 * multiplier}px`,
        width: `${110 * multiplier}px`,
        ...style,
      }}
    >
      <p
        style={{
          textAlign: 'right',
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: `${16 * multiplier}px`,
          color: "#FFF",
          margin: 0,
          padding: 0
        }}
      >
        {genName}:
      </p>
      <p
        style={{
          textAlign: 'right',
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: `${16 * multiplier}px`,
          margin: 0,
          marginLeft: '4px',
          padding: 0
        }}
      >
        <span style={{ color: `rgb(255,215,0)` }}>{genValue}</span>
      </p>
    </div>
  )
}
