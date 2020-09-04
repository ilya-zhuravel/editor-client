import React, { useCallback, useState, ChangeEvent } from 'react';
import { get, has, pick } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import classNames from 'classnames';
import { IconButton } from '@material-ui/core';
import { EditorState } from 'prosemirror-state';
import { Alert } from '@material-ui/lab';

import {
  createBlankReference,
  Reference,
  ReferenceContributor,
  ReferenceType,
  createEmptyRefInfoByType,
  ReferenceInfoType
} from 'app/models/reference';
import { Select } from 'app/components/select';
import { useReferenceFormStyles } from 'app/containers/reference-form-dialog/styles';
import { ActionButton } from 'app/components/action-button';
import { renderConfirmDialog } from 'app/components/prompt-dialog';
import { ReferenceContributorsList } from 'app/containers/reference-form-dialog/reference-contributors-list';
import {
  FormControlConfigType,
  getFormConfigForType
} from 'app/containers/reference-form-dialog/reference-forms.config';
import { renderFormControl } from 'app/containers/reference-form-dialog/reference-form-renderer';
import refFormGrid from 'app/styles/form-grid.module.scss';
import { objectsEqual } from 'app/utils/view.utils';

interface ReferenceFormDialogProps {
  reference?: Reference;
  onAccept(reference: Reference): void;
  onCancel(): void;
  onDelete(reference: Reference): void;
}

export const ReferenceFormDialog: React.FC<ReferenceFormDialogProps> = ({
  reference,
  onAccept,
  onCancel,
  onDelete
}) => {
  const classes = useReferenceFormStyles();
  const [isConfirmShown, setConfirmShow] = useState<boolean>(false);
  const isNewReference = !reference;
  const [userReference, setReference] = useState<Reference>(reference || createBlankReference());
  const [missingFieldsInfo, setMissingFieldsInfo] = useState<Partial<ReferenceInfoType>>({});
  const [missingFieldsConfig, setMissingFieldsConfig] = useState<Record<string, FormControlConfigType>>({});
  const handleReferenceTypeChange = useCallback(
    (event: ChangeEvent<{ name: string; value: ReferenceType }>) => {
      const newRefInfo = createEmptyRefInfoByType(event.target['value']);
      const newRef = {
        ...userReference,
        type: event.target['value'],
        referenceInfo: transferValues(userReference.referenceInfo, newRefInfo, missingFieldsInfo)
      };
      if (userReference.referenceInfo) {
        const missingInfo = getDiffFieldValues(userReference.referenceInfo, newRefInfo, missingFieldsInfo);
        setMissingFieldsInfo(missingInfo);
        setMissingFieldsConfig(getDiffFieldsConfig(userReference.type, newRef.type, missingFieldsConfig, missingInfo));
      }
      setReference(newRef);
    },
    [userReference, missingFieldsInfo, missingFieldsConfig]
  );

  const handleAuthorsListChange = useCallback(
    (refAuthors: ReferenceContributor[]) => {
      setReference({
        ...userReference,
        authors: refAuthors
      });
    },
    [userReference, setReference]
  );

  const handleRefInfoChange = useCallback(
    (name, value) => {
      setReference({
        ...userReference,
        referenceInfo: {
          ...userReference.referenceInfo,
          [name]: value
        }
      });
    },
    [userReference]
  );

  const handleMissingFieldsInfoChange = useCallback(
    (name, value) => {
      setMissingFieldsInfo({
        ...missingFieldsInfo,
        [name]: value
      });
    },
    [missingFieldsInfo]
  );

  const handleDone = useCallback(() => {
    userReference.authors = userReference.authors.filter(
      (author) => author['firstName'] || author['lastName'] || author['groupName']
    );
    if (!objectsEqual(userReference, reference)) {
      onAccept(userReference);
    } else {
      onCancel();
    }
  }, [userReference, reference, onAccept, onCancel]);

  const handleReject = useCallback(() => {
    setConfirmShow(false);
  }, [setConfirmShow]);

  const handleDeleteRow = useCallback(
    (fieldName: string) => () => {
      const updateMissingFields = { ...missingFieldsInfo };
      delete updateMissingFields[fieldName];
      setMissingFieldsInfo(updateMissingFields);
    },
    [missingFieldsInfo]
  );

  const handleDelete = useCallback(() => {
    setConfirmShow(true);
  }, [setConfirmShow]);

  const handleAccept = useCallback(() => {
    setConfirmShow(false);
    onDelete(userReference);
  }, [userReference, onDelete]);

  const formConfig = getFormConfigForType(userReference.type);
  const form = formConfig
    ? Object.entries(formConfig).map(([key, config]) => {
        return renderFormControl(
          config.type,
          config.label,
          key,
          classNames(config.className),
          get(userReference, `referenceInfo.${key}`),
          handleRefInfoChange
        );
      })
    : undefined;

  const diffForm = Object.entries(missingFieldsInfo).map(([key, value]) => {
    const config = missingFieldsConfig[key];
    return (
      <div className={classNames(classes.missingFieldsRow, classes.inputField)}>
        {renderFormControl(
          config.type,
          config.label,
          key,
          classes.missingField,
          value,
          handleMissingFieldsInfoChange,
          true
        )}
        <IconButton classes={{ root: classes.deleteButton }} onClick={handleDeleteRow(key)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
    );
  });

  return (
    <section className={classes.root}>
      <Select
        className={classes.inputField}
        name="type"
        test-id={'ref-type'}
        placeholder="Please select"
        fullWidth
        blankValue={undefined}
        label="Reference type"
        value={userReference.type}
        onChange={handleReferenceTypeChange}
        options={[
          { label: 'Journal Article', value: 'journal' },
          { label: 'Book', value: 'book' },
          { label: 'Data', value: 'data' },
          { label: 'Software', value: 'software' },
          { label: 'Preprint', value: 'preprint' },
          { label: 'Web Article', value: 'web' },
          { label: 'Conference proceedings', value: 'confproc' },
          { label: 'Report', value: 'report' },
          { label: 'Thesis', value: 'thesis' },
          { label: 'Patent', value: 'patent' },
          { label: 'Periodical Article', value: 'periodical' }
        ]}
      />
      <ReferenceContributorsList
        className={classes.inputField}
        addCtaLabel={'Author'}
        entityName={'author'}
        test-id={'ref-authors'}
        refContributors={userReference.authors}
        onChange={handleAuthorsListChange}
      />
      <div className={classNames(classes.inputField, refFormGrid.container)}>{form}</div>
      {diffForm.length > 0 ? (
        <div className={classes.missingFieldsSection}>
          <Alert elevation={0} variant="filled" severity="error" classes={{ root: classes.missingFieldsMessage }}>
            Unsupported elements for reference type
          </Alert>
          {diffForm}
        </div>
      ) : undefined}
      <div className={classes.buttonPanel}>
        {!isNewReference ? <ActionButton variant="outlinedWarning" onClick={handleDelete} title="Delete" /> : undefined}
        <div aria-hidden={true} className={classes.spacer}></div>
        <ActionButton variant="secondaryOutlined" onClick={onCancel} title="Cancel" />
        <ActionButton variant="primaryContained" onClick={handleDone} title="Done" />
      </div>
      {isConfirmShown
        ? renderConfirmDialog(
            'You are deleting a reference',
            'Deleting a a reference can leave unlinked citations. Are you sure you want to proceed?',
            handleAccept,
            handleReject
          )
        : undefined}
    </section>
  );
};

function transferValues(
  prevRefInfo: ReferenceInfoType,
  nextRefInfo: ReferenceInfoType,
  prevMissingInfo: Partial<ReferenceInfoType> = {}
): ReferenceInfoType {
  Object.entries(nextRefInfo).forEach(([key, value]) => {
    nextRefInfo[key] = get(prevRefInfo, key, get(prevMissingInfo, key, value));
  });

  return nextRefInfo;
}

function getDiffFieldValues(
  prevRefInfo: ReferenceInfoType,
  nextRefInfo: ReferenceInfoType,
  prevMissingInfo: Partial<ReferenceInfoType> = {}
): Partial<ReferenceInfoType> {
  const diffKeys = Object.keys(prevRefInfo).filter((key) => !has(nextRefInfo, key) && !isValueEmpty(prevRefInfo[key]));
  const unsalvagedFieldKeys = Object.keys(prevMissingInfo).filter((key) => !has(nextRefInfo, key));
  return {
    ...pick(prevRefInfo, diffKeys),
    ...pick(prevMissingInfo, unsalvagedFieldKeys)
  };
}

function getDiffFieldsConfig(
  prevType: ReferenceType,
  nextType: ReferenceType,
  prevMissingFieldsConfig: Record<string, FormControlConfigType> = {},
  currentMissingFields: Partial<ReferenceInfoType> = {}
): Record<string, FormControlConfigType> {
  const prevConfig = getFormConfigForType(prevType);
  const nextConfig = getFormConfigForType(nextType);
  const diffKeys = Object.keys(prevConfig).filter((key: ReferenceType) => !Boolean(nextConfig[key]));
  const unsalvagedFieldsConfigKeys = Object.keys(currentMissingFields).filter((key) =>
    has(prevMissingFieldsConfig, key)
  );
  return {
    ...pick(prevConfig, diffKeys),
    ...pick(prevMissingFieldsConfig, unsalvagedFieldsConfigKeys)
  };
}

function isValueEmpty(value: EditorState | Array<ReferenceContributor> | string | number): boolean {
  if (value instanceof EditorState) {
    return !value.doc || value.doc.childCount === 0 || value.doc.textContent.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return !value;
}