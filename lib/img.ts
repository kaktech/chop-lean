/** Photos are either a filename in /public/images or a full URL (admin uploads). */
export const imgSrc = (image: string | null | undefined) =>
  !image ? "/images/meal-box.jpg" : image.startsWith("http") ? image : `/images/${image}`;
