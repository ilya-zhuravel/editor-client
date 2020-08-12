import React, { useCallback } from 'react';
import { IconButton } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useSelector, useDispatch } from 'react-redux';

import { SectionContainer } from 'app/components/section-container';
import { getArticleInformation } from 'app/selectors/manuscript.selectors';
import { useArticleInformationStyles } from 'app/containers/manuscript/article-information/styles';
import * as manuscriptEditorActions from 'app/actions/manuscript-editor.actions';
import { ArticleInfoFormDialog } from 'app/containers/article-info-form-dialog';
import moment from 'moment';

export const ArticleInformation: React.FC<{}> = () => {
  const articleInfo = useSelector(getArticleInformation);
  const dispatch = useDispatch();
  const editArticleInfo = useCallback(() => {
    dispatch(
      manuscriptEditorActions.showModalDialog({
        component: ArticleInfoFormDialog,
        title: 'Article Information'
      })
    );
  }, [dispatch]);
  const publicationDate = moment(articleInfo.publicationDate);
  const classes = useArticleInformationStyles();
  return (
    <SectionContainer label="Article information" className={classes.sectionContainer}>
      <section className={classes.infoSection}>
        <div>
          <strong> Subject: </strong> {articleInfo.subjects.join(', ')}
        </div>
        <div>
          <strong> Article type: </strong> {articleInfo.articleType}
        </div>
        <div>
          <strong> Article DOI: </strong> {articleInfo.articleDOI}
        </div>
        <div>
          <strong> Publisher ID: </strong> {articleInfo.publisherId}
        </div>
        <div>
          <strong> eLocation ID: </strong> {articleInfo.elocationId}
        </div>
        <div>
          <strong> Year: </strong> {publicationDate.format('YYYY')}
        </div>
        <div>
          <strong> Volume: </strong> {articleInfo.volume}
        </div>
        <div>&nbsp;</div>
        <div>
          <strong> Published: </strong> {publicationDate.format('MMMM D, YYYY')}
        </div>
        <div>
          <strong> eLocation ID: </strong> {articleInfo.elocationId}
        </div>
        <div>
          <strong> Volume: </strong> {articleInfo.volume}
        </div>
      </section>
      <IconButton classes={{ root: classes.editButton }} onClick={editArticleInfo}>
        <EditIcon fontSize="small" />
      </IconButton>
    </SectionContainer>
  );
};
