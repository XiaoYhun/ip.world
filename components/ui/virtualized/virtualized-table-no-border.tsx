/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { TableVirtuoso } from "react-virtuoso"
import { Table, TableBody, TableCell, TableFooter, TableHeader, TableRow } from "../table"

const TableComponents = {
  Table: Table,
  TableRow: (props: any) => <TableRow className="border-b border-neutral-600" {...props} />,
  TableCell: TableCell,
  TableBody: TableBody,
  TableFooter: TableFooter,
  TableHeader: TableHeader,
}

type VirtualizedTableProps = {
  data: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  header: React.ReactNode
}

const ROW_HEIGHT_ESTIMATE = 56
const HEADER_HEIGHT_ESTIMATE = 36
const MAX_HEIGHT = 280

const VirtualizedTable = ({ data, renderItem, header }: VirtualizedTableProps) => {
  const height = Math.min(MAX_HEIGHT, HEADER_HEIGHT_ESTIMATE + data.length * ROW_HEIGHT_ESTIMATE)

  return (
    <TableVirtuoso
      data={data}
      style={{ height }}
      className="no-scrollbar"
      fixedHeaderContent={() => header}
      components={TableComponents}
      itemContent={(index, item) => renderItem(item, index)}
    />
  )
}

export default VirtualizedTable
