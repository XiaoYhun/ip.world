export const elementTopOffsetRelativeToDocument = (element: HTMLElement): number => {
  return element.getBoundingClientRect().top + document.documentElement.scrollTop
}

export const scrollTo = (id: string, offset = 120) => {
  const dom = document.getElementById(id)
  if (dom) {
    window.scrollTo({
      top: elementTopOffsetRelativeToDocument(dom) + offset,
      behavior: "smooth",
    })
  }
}
