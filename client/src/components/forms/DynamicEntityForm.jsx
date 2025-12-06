import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import { capitalize } from '../../utils/string';
import styles from './EntityForm.module.css';

/**
 * DynamicEntityForm
 *
 * Schema-driven form component that renders entity forms based on field definitions.
 * Reduces boilerplate by centralizing form rendering logic.
 *
 * @example
 * import { SOURCE_SCHEMA } from './formSchemas';
 * <DynamicEntityForm
 *   schema={SOURCE_SCHEMA}
 *   platforms={platforms}
 *   onSubmit={handleSubmit}
 *   onClose={handleClose}
 * />
 */
export default function DynamicEntityForm({
  schema,
  platforms = [],
  onSubmit,
  onClose,
  initialData = null,
}) {
  // Initialize form data from schema defaults or initial data
  const initialFormData = useMemo(() => {
    return schema.fields.reduce((acc, field) => {
      if (initialData && initialData[field.name] !== undefined) {
        acc[field.name] = initialData[field.name];
      } else if (field.default !== undefined) {
        acc[field.name] = field.default;
      } else if (field.type === 'platform-select' && platforms.length > 0) {
        acc[field.name] = platforms[0]?.id || 'custom';
      } else {
        acc[field.name] = '';
      }
      return acc;
    }, {});
  }, [schema.fields, initialData, platforms]);

  const [formData, setFormData] = useState(initialFormData);

  const handleChange = useCallback((fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onSubmit(formData);
    },
    [formData, onSubmit]
  );

  /**
   * Format option text based on formatOption setting
   */
  const formatOption = (value, format) => {
    if (format === 'underscore') {
      return value.replace(/_/g, ' ');
    }
    return capitalize(value);
  };

  /**
   * Render a form field based on its type
   */
  const renderField = (field) => {
    const fieldId = `form-${field.name}`;
    const commonProps = {
      id: fieldId,
      value: formData[field.name],
      onChange: (e) => handleChange(field.name, e.target.value),
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            {...commonProps}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            {...commonProps}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            {...commonProps}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {formatOption(option, field.formatOption)}
              </option>
            ))}
          </select>
        );

      case 'platform-select':
        return (
          <select {...commonProps}>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={field.placeholder}
            rows={field.rows || 3}
          />
        );

      default:
        return (
          <input
            type="text"
            {...commonProps}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <div className={styles.formOverlay} onClick={onClose}>
      <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
        <h3>{schema.title}</h3>
        <form onSubmit={handleSubmit}>
          {schema.fields.map((field) => (
            <div key={field.name} className={styles.formField}>
              <label htmlFor={`form-${field.name}`}>
                {field.label}
                {field.required && ' *'}
              </label>
              {renderField(field)}
            </div>
          ))}
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{schema.submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

DynamicEntityForm.propTypes = {
  /** Schema defining form fields and structure */
  schema: PropTypes.shape({
    title: PropTypes.string.isRequired,
    submitLabel: PropTypes.string.isRequired,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.oneOf([
          'text',
          'email',
          'url',
          'select',
          'platform-select',
          'textarea',
        ]).isRequired,
        required: PropTypes.bool,
        placeholder: PropTypes.string,
        options: PropTypes.arrayOf(PropTypes.string),
        default: PropTypes.string,
        formatOption: PropTypes.oneOf(['capitalize', 'underscore']),
        rows: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
  /** Platforms list for platform-select fields */
  platforms: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  /** Callback when form is submitted */
  onSubmit: PropTypes.func.isRequired,
  /** Callback to close the form */
  onClose: PropTypes.func.isRequired,
  /** Optional initial data for editing */
  initialData: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
  ),
};
