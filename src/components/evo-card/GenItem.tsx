import React, { FC } from 'react';
import { IGenItem } from "./types";



export const GenItem = ({ multiplier = 1, genName, genValue, style }: IGenItem) => {

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: `${5 * multiplier}px`,
        height: `${12 * multiplier}px`,
        width: `${55 * multiplier}px`,
        ...style,
      }}
    >
      <p
        style={{
          textAlign: 'right',
          fontFamily: 'Nunito',
          fontWeight: 500,
          fontSize: `${6 * multiplier}px`,
          color: 'rgba(255,255,255, 1)',
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
          fontWeight: 400,
          fontSize: `${6 * multiplier}px`,
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

export interface ITextItem {
  multiplier?: number,
  genName: string,
  genValue: string,
  position: number
}

export const TextItem: FC<ITextItem> = ({ multiplier = 1, genName, genValue, position }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        columnGap: `${4 * multiplier}px`,
        width: '100%',
        marginTop: `${(position>2 ? -3 : 0)*multiplier}px`,
        marginBottom: `${(position<3 ? -3 : 0)*multiplier}px`
      }}
    >
      <p
        style={{
          textAlign: 'right',
          fontFamily: 'Nunito',
          fontWeight: 500,
          fontSize: `${6 * multiplier}px`,
          color: 'rgba(255,255,255, 1)',
          margin: 0,
          padding: 0
        }}
      >
        {genName}:
      </p>
      <p style={{
        textAlign: 'right',
        fontFamily: 'Nunito',
        fontWeight: 400,
        fontSize: `${6 * multiplier}px`,
        margin: 0,
        padding: 0
      }}>
        <span style={{ color: 'rgba(255,255,255, 1)' }}>{genValue}</span>
      </p>
    </div>
  )
}
