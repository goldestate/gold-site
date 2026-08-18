import { supabase } from './supabase';
import {
  isPropertyType,
  isUnitType,
  normalizeLegacyLocation,
  type LocationValue,
  type PropertyTypeValue,
  type UnitTypeValue
} from './property-taxonomy';

export type Property = {
  id: string;
  name: string;
  location: LocationValue;
  propertyType: PropertyTypeValue;
  unitType: UnitTypeValue;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  images: string[];
  tone: 'color' | 'mono';
  published: boolean;
  createdAt: string;
};

export type PropertyInput = {
  name: string;
  location: LocationValue;
  propertyType: PropertyTypeValue;
  unitType: UnitTypeValue;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  images: string[];
  tone: 'color' | 'mono';
  published: boolean;
};

type PropertyRow = {
  id: string;
  name: string;
  location: string;
  property_type: string;
  unit_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  images: unknown;
  tone: string;
  published: boolean;
  created_at: string;
};

function rowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    name: row.name,
    location: normalizeLegacyLocation(row.location),
    propertyType: isPropertyType(row.property_type) ? row.property_type : 'resale',
    unitType: isUnitType(row.unit_type) ? row.unit_type : 'apartment',
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: row.area,
    description: row.description,
    images: Array.isArray(row.images) ? row.images.filter((item): item is string => typeof item === 'string') : [],
    tone: row.tone === 'mono' ? 'mono' : 'color',
    published: row.published,
    createdAt: row.created_at
  };
}

function inputToRow(input: PropertyInput) {
  return {
    name: input.name,
    location: input.location,
    property_type: input.propertyType,
    unit_type: input.unitType,
    price: input.price,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area: input.area,
    description: input.description,
    images: input.images,
    tone: input.tone,
    published: input.published
  };
}

function patchToRow(patch: Partial<PropertyInput>) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.propertyType !== undefined) row.property_type = patch.propertyType;
  if (patch.unitType !== undefined) row.unit_type = patch.unitType;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.bedrooms !== undefined) row.bedrooms = patch.bedrooms;
  if (patch.bathrooms !== undefined) row.bathrooms = patch.bathrooms;
  if (patch.area !== undefined) row.area = patch.area;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.images !== undefined) row.images = patch.images;
  if (patch.tone !== undefined) row.tone = patch.tone;
  if (patch.published !== undefined) row.published = patch.published;
  return row;
}

export async function readProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PropertyRow[]).map(rowToProperty);
}

export async function readPublishedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as PropertyRow[]).map(rowToProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToProperty(data as PropertyRow) : null;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const { data, error } = await supabase.from('properties').insert(inputToRow(input)).select('*').single();
  if (error) throw error;
  return rowToProperty(data as PropertyRow);
}

export async function updateProperty(id: string, patch: Partial<PropertyInput>): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .update(patchToRow(patch))
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProperty(data as PropertyRow) : null;
}

export async function deleteProperty(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('properties').delete().eq('id', id).select('id').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
