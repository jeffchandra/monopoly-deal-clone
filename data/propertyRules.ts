import { PropertyColor } from "../types/card";

export const PROPERTY_RULES:
Record<
  PropertyColor,
  {
    setSize: number;
  }
> = {
  brown: {
    setSize: 2,
  },

  lightBlue: {
    setSize: 3,
  },

  pink: {
    setSize: 3,
  },

  orange: {
    setSize: 3,
  },

  red: {
    setSize: 3,
  },

  yellow: {
    setSize: 3,
  },

  green: {
    setSize: 3,
  },

  darkBlue: {
    setSize: 2,
  },

  railroad: {
    setSize: 4,
  },

  utility: {
    setSize: 2,
  },
};