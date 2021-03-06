import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import PaginatedTable from './PaginatedTable'
import { Dropdown, Loader } from 'semantic-ui-react'
import styled from 'styled-components'
import colors from 'js/constants/colors'
import SectionSubtitleDescription from 'js/components/common/SectionSubtitleDescription'
import { isHiddenProperty } from 'js/constants/hiddenArticleProperties'
import feedSelectors from 'js/selectors/feeds'

const StyledRow = styled(PaginatedTable.Row)`
  cursor: ${props => !props.clickable ? '' : 'pointer'};
  &:hover {
    cursor: ${props => !props.clickable ? '' : props.selected ? '' : 'pointer'};
  }
`

const LoadingBox = styled.div`
  position: relative;
  background-color: rgba(32,34,37,0.6);
  border-radius: 3px;
  padding: 3em;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 115px;
  ${props => props.error ? `color: ${colors.discord.red} !important;` : ''}
  text-align: center;
`

const ErrorText = styled.div`
  word-break: break-all;
  text-align: center;
`

function ArticleTable (props) {
  const placeholderList = useSelector(state => state.articles.placeholders)
  const articlesFetching = useSelector(feedSelectors.articlesFetching)
  const articlesError = useSelector(feedSelectors.articlesFetchErrored)
  const [articleProperty, setArticleProperty] = useState('')
  const [selectedArticleID, setSelectedArticleID] = useState('')
  const { addColumns, positiveNegativeRowFunc } = props

  useEffect(() => {
    if (articleProperty || placeholderList.length === 0) {
      return
    }
    const article = placeholderList[0]
    if (article.title && placeholderList[1] && placeholderList[1].title !== article.title) {
      setArticleProperty('title')
      return
    }
    for (const placeholder in article) {
      if (!placeholder) {
        continue
      }
      if (placeholderList[1]) {
        if (placeholderList[1][placeholder] !== article[placeholder]) {
          // Try to select a placeholder where its content is different from other articles
          setArticleProperty(placeholder)
          return
        }
      } else {
        setArticleProperty(placeholder)
        return
      }
    }
    // If the above fails, just use the duplicated property
    setArticleProperty(Object.keys(article)[0])
  }, [placeholderList, articleProperty])

  if (articlesError) {
    return (
      <LoadingBox>
        <ErrorText>
          <SectionSubtitleDescription style={{ color: colors.discord.red }}>Failed to Load Articles</SectionSubtitleDescription>
          <SectionSubtitleDescription>{articlesError.message || 'Unknown Error'}</SectionSubtitleDescription>
        </ErrorText>
      </LoadingBox>
    )
  }

  if (articlesFetching) {
    return (
      <LoadingBox>
        <Loader inverted size='big' active />
      </LoadingBox>
    )
  }

  let addedHeaders = []
  let addedCellFuncs = []
  let collapsingCells = []
  if (addColumns) {
    for (const data of addColumns) {
      if (!data.headers) throw new Error('Missing added column headers')
      if (!data.cellFuncs) throw new Error('Missing added cell functions')
      addedHeaders = addedHeaders.concat(data.headers)
      addedCellFuncs = addedCellFuncs.concat(data.cellFuncs)
      collapsingCells = collapsingCells.concat(data.collapsing)
    }
  }
  const classificationsItems = placeholderList
  const classificationsDropdownOptions = []
  const added = {}
  for (const article of placeholderList) {
    for (const placeholder in article) {
      if (added[placeholder]) continue
      const isRegexPlaceholder = placeholder.includes('regex:')
      const prettyPlaceholderName = placeholder.replace('regex:', '')
      if (!isHiddenProperty(placeholder)) {
        classificationsDropdownOptions.push({ text: isRegexPlaceholder ? `${prettyPlaceholderName} (regex)` : prettyPlaceholderName, value: placeholder })
        added[placeholder] = true
      }
    }
  }

  const onClickArticle = (article, id) => {
    const { onClickArticle } = props
    if (!onClickArticle) return
    onClickArticle(article)
    setSelectedArticleID(id)
  }

  const classificationsTableRowFunc = data => {
    const positive = positiveNegativeRowFunc ? positiveNegativeRowFunc(data) : null
    const id = data._id
    return (
      <StyledRow
        clickable={(!!props.onClickArticle).toString()}
        onClick={e => onClickArticle(data, id)}
        active={selectedArticleID === id}
        key={id}
        positive={positive === true}
        negative={positive === false}
      >
        {addedCellFuncs.map((func, i) => <PaginatedTable.Cell collapsing={collapsingCells[i]} key={`cfun${i}`}>{func(data)}</PaginatedTable.Cell>)}
        <PaginatedTable.Cell>{data[articleProperty]}</PaginatedTable.Cell>
      </StyledRow>
    )
  }

  const classificationsTableSearchFunc = (data, search) => data[articleProperty] ? data[articleProperty].toLowerCase().includes(search) : true

  return (
    <PaginatedTable.Table
      compact
      unstackable
      maxPerPage={10}
      items={classificationsItems}
      allowActiveRows
      headers={addedHeaders.concat([articleProperty.replace('regex:', '')])}
      itemFunc={classificationsTableRowFunc}
      searchFunc={classificationsTableSearchFunc}
      button={
        <Dropdown
          search
          selection
          options={classificationsDropdownOptions}
          onChange={(e, data) => setArticleProperty(data.value)}
          value={articleProperty}
        />
      }
    />
  )
}

ArticleTable.propTypes = {
  onClickArticle: PropTypes.func,
  positiveNegativeRowFunc: PropTypes.func,
  addColumns: PropTypes.array
}

export default ArticleTable
