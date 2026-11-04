import { supabase } from "./supabase";

const BUCKET = "product-images";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: item.price,
    images: item.images || [],
    image: item.images?.[0] || "",
    category: item.category,
    status: item.status,
    createdAt: item.created_at,
  }));
}

export async function saveProduct(product) {
  const payload = {
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: product.price,
    images: product.images || [],
    category: product.category,
    status: product.status || "AVAILABLE",
    created_at: product.createdAt || Date.now(),
  };

  const { error } = await supabase
    .from("products")
    .upsert(payload);

  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadProductImage(file) {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function getHeroImage() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "hero_image")
    .maybeSingle();

  if (error) throw error;

  return data?.value || "/images/hero.jpg";
}

export async function saveHeroImage(url) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "hero_image", value: url });

  if (error) throw error;
}