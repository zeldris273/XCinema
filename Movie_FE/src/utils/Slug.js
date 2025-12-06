const Slug = (title) => {
    if (!title) return "";
    let slug = title.toLowerCase().replace(/\s+/g, "-");
    slug = slug.replace(/[^a-z0-9-]/g, "");
    slug = slug.replace(/-+/g, "-");
    return slug;
};

export default Slug;