/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { TableVirtuoso } from "react-virtuoso"
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from "../table"

const makeTableComponents = (stickyTop?: number) => ({
  Table: Table,
  TableRow: TableRow,
  TableCell: TableCell,
  TableBody: TableBody,
  TableFooter: TableFooter,
  TableHeader: stickyTop !== undefined
    ? React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => (
        <TableHeader ref={ref} {...props} style={{ ...props.style, top: stickyTop }} />
      ))
    : TableHeader,
})

type VirtualizedTableProps = {
  data: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  header: React.ReactNode
  onEndReached?: () => void
  style?: React.CSSProperties
  useWindowScroll?: boolean
  stickyHeaderTop?: number
}

const VirtualizedTable = ({ data, renderItem, header, onEndReached, style = { height: 500 }, useWindowScroll = false, stickyHeaderTop }: VirtualizedTableProps) => {
  const components = React.useMemo(() => makeTableComponents(stickyHeaderTop), [stickyHeaderTop])
  return (
    <TableVirtuoso
      data={data}
      style={useWindowScroll ? undefined : style}
      useWindowScroll={useWindowScroll}
      fixedHeaderContent={() => header}
      components={components}
      itemContent={(index, item) => renderItem(item, index)}
      endReached={() => onEndReached?.()}
    />
  )
}

export default VirtualizedTable
